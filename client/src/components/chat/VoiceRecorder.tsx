import { Mic, Send, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button.js';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, onCancel }) => {
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob, duration);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start audio recording:', err);
      onCancel();
    }
  };

  const stopRecordingCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center justify-between gap-4 glass-card px-4 py-2.5 rounded-2xl border-rose-500/30 bg-rose-500/10 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
        <Mic className="w-4 h-4 text-rose-500 dark:text-rose-400" />
        <span className="text-xs font-mono font-bold text-slate-800 dark:text-white tracking-wider">
          Recording {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors"
          title="Cancel Recording"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={stopRecordingCleanup}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          Send Voice
        </Button>
      </div>
    </div>
  );
};
