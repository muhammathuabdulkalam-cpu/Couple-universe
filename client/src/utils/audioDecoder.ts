import { getMemoryAccessToken } from '../api/axiosClient';

/**
 * Convert AudioBuffer (PCM data) into standard 16-bit PCM WAV Blob
 */
function bufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(buffer.numberOfChannels, 2);
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataByteLength = result.length * bytesPerSample;
  const headerByteLength = 44;
  const wavBuffer = new ArrayBuffer(headerByteLength + dataByteLength);
  const view = new DataView(wavBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + dataByteLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, dataByteLength, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Returns a Cloudinary MP3 transcode URL for any uploaded audio file format (.m4a, .flac, .wav, .ogg, .aac, .wma, etc.)
 */
export function getCloudinaryMp3Url(cloudinaryUrl: string): string {
  if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) return cloudinaryUrl;
  
  // Replace audio/video extensions with .mp3 or insert /f_mp3/ transformation flag
  let mp3Url = cloudinaryUrl.replace(/\.(m4a|flac|wav|ogg|aac|wma|opus|aiff)$/i, '.mp3');
  
  if (!mp3Url.includes('/f_mp3') && mp3Url.includes('/upload/')) {
    mp3Url = mp3Url.replace('/upload/', '/upload/f_mp3,ac_mp3/');
  }
  
  return mp3Url;
}

/**
 * Normalize relative or format-restricted URLs into playable browser source URLs
 */
export function getNormalizedAudioUrl(rawUrl?: string): string {
  if (!rawUrl) return '';

  let url = rawUrl.trim();
  const token = getMemoryAccessToken();

  // If it's a relative API path like /api/v1/music/songs/.../play, prepend backend origin if needed
  if (url.startsWith('/')) {
    const apiBase = (import.meta as any).env?.VITE_API_URL || '';
    if (apiBase.startsWith('http')) {
      const origin = new URL(apiBase).origin;
      url = `${origin}${url}`;
    } else if (typeof window !== 'undefined') {
      url = `${window.location.origin}${url}`;
    }
  }

  // Attach auth token query parameter for internal API audio streaming endpoints if available
  if (token && url.includes('/api/v1/music/songs/') && url.includes('/play') && !url.includes('token=')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}token=${encodeURIComponent(token)}`;
  }

  // Cloudinary MP3 auto-transcoding
  if (url.includes('cloudinary.com')) {
    url = getCloudinaryMp3Url(url);
  }

  return url;
}

/**
 * Transcode any unsupported audio stream into a universal WAV Blob URL using Web Audio API PCM decoder
 */
export async function decodeAudioToWavUrl(audioUrl: string): Promise<string> {
  const normalizedUrl = getNormalizedAudioUrl(audioUrl);
  const token = getMemoryAccessToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(normalizedUrl, { headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} failed to fetch audio file from ${normalizedUrl}`);
  }
  const arrayBuffer = await response.arrayBuffer();

  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtxClass) {
    throw new Error('Web Audio API unavailable in this browser environment');
  }

  const audioCtx = new AudioCtxClass();
  try {
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume().catch(() => {});
    }

    const bufferCopy = arrayBuffer.slice(0);
    const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
      let isDone = false;
      const onSuccess = (decoded: AudioBuffer) => {
        if (!isDone) {
          isDone = true;
          resolve(decoded);
        }
      };
      const onError = (err: any) => {
        if (!isDone) {
          isDone = true;
          reject(err || new Error('Web Audio API failed to decode audio data'));
        }
      };

      try {
        const res = audioCtx.decodeAudioData(bufferCopy, onSuccess, onError);
        if (res && typeof (res as any).then === 'function') {
          (res as any).then(onSuccess).catch(onError);
        }
      } catch (err) {
        onError(err);
      }
    });

    const wavBlob = bufferToWav(audioBuffer);
    return URL.createObjectURL(wavBlob);
  } finally {
    audioCtx.close().catch(() => {});
  }
}

