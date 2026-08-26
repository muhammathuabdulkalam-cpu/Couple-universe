import { env } from '../config/env.config';
import { logger } from '../config/logger.config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const YoutubeSearchApi = require('youtube-search-api');

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

const FALLBACK_VIDEOS: YouTubeSearchResult[] = [
  {
    videoId: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    description: 'Official Music Video for Despacito',
    thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/0.jpg',
    channelTitle: 'Luis Fonsi',
    publishedAt: new Date().toISOString(),
  },
  {
    videoId: 'hT_nvWreIhg',
    title: 'OneRepublic - Counting Stars',
    description: 'Official Music Video for Counting Stars',
    thumbnail: 'https://img.youtube.com/vi/hT_nvWreIhg/0.jpg',
    channelTitle: 'OneRepublic',
    publishedAt: new Date().toISOString(),
  },
  {
    videoId: 'DWcJFNfaw9c',
    title: 'Ed Sheeran - Shape of You (Official Music Video)',
    description: 'Official Music Video for Shape of You',
    thumbnail: 'https://img.youtube.com/vi/DWcJFNfaw9c/0.jpg',
    channelTitle: 'Ed Sheeran',
    publishedAt: new Date().toISOString(),
  },
  {
    videoId: 'eYq7WapuDLU',
    title: 'Enjoy Enjaami - Dhee ft. Arivu | Santhosh Narayanan',
    description: 'Official Music Video for Enjoy Enjaami',
    thumbnail: 'https://img.youtube.com/vi/eYq7WapuDLU/0.jpg',
    channelTitle: 'maajja',
    publishedAt: new Date().toISOString(),
  },
  {
    videoId: 'v7BNPoTUms8',
    title: 'Rowdy Baby - Maari 2 | Dhanush, Sai Pallavi',
    description: 'Official Video Song of Rowdy Baby',
    thumbnail: 'https://img.youtube.com/vi/v7BNPoTUms8/0.jpg',
    channelTitle: 'Wunderbar Studios',
    publishedAt: new Date().toISOString(),
  },
  {
    videoId: 'BddP6PYo2gs',
    title: 'Kesariya - Brahmāstra | Ranbir Kapoor, Alia Bhatt | Arijit Singh',
    description: 'Official Video Song of Kesariya',
    thumbnail: 'https://img.youtube.com/vi/BddP6PYo2gs/0.jpg',
    channelTitle: 'Sony Music India',
    publishedAt: new Date().toISOString(),
  },
];

/**
 * Search YouTube using the youtube-search-api package (no API key needed).
 * Falls back to the YouTube Data API v3 if configured.
 * Falls back to curated videos if both fail.
 */
export const searchYouTubeVideos = async (
  query: string
): Promise<{ success: boolean; results: YouTubeSearchResult[]; message?: string }> => {
  const apiKey = env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

  // --- Primary: Real YouTube scrape (no API key needed) ---
  try {
    logger.info(`🔍 Searching YouTube for: "${query}" via youtube-search-api`);
    const searchResponse = await YoutubeSearchApi.GetListByKeyword(query, false, 25);
    const items: any[] = searchResponse?.items || [];

    const results: YouTubeSearchResult[] = items
      .filter((item: any) => item.type === 'video' && item.id)
      .map((item: any) => {
        // Get the best thumbnail available
        const thumbnails: any[] = item.thumbnail?.thumbnails || [];
        const bestThumb = thumbnails.find((t: any) => t.width >= 360) || thumbnails[0];
        const thumbnailUrl = bestThumb?.url || `https://img.youtube.com/vi/${item.id}/0.jpg`;

        return {
          videoId: item.id,
          title: item.title || 'Untitled Video',
          description: '',
          thumbnail: thumbnailUrl,
          channelTitle: item.channelTitle || 'YouTube Channel',
          publishedAt: new Date().toISOString(),
        };
      });

    if (results.length > 0) {
      logger.info(`✅ youtube-search-api returned ${results.length} results for: "${query}"`);
      return { success: true, results };
    }

    logger.warn(`⚠️ youtube-search-api returned 0 results for: "${query}", trying fallback`);
  } catch (err: any) {
    logger.warn(`⚠️ youtube-search-api failed: ${err.message}. Trying YouTube Data API...`);
  }

  // --- Secondary: YouTube Data API v3 (if API key is configured) ---
  if (apiKey && apiKey.trim()) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&q=${encodeURIComponent(query)}&key=${apiKey}`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (response.ok && !data.error && data.items?.length > 0) {
        const results: YouTubeSearchResult[] = data.items
          .filter((item: any) => item.id?.videoId)
          .map((item: any) => ({
            videoId: item.id.videoId,
            title: item.snippet?.title || 'Untitled Video',
            description: item.snippet?.description || '',
            thumbnail:
              item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.medium?.url ||
              `https://img.youtube.com/vi/${item.id.videoId}/0.jpg`,
            channelTitle: item.snippet?.channelTitle || 'Unknown Channel',
            publishedAt: item.snippet?.publishedAt || '',
          }));

        if (results.length > 0) {
          logger.info(`✅ YouTube Data API returned ${results.length} results for: "${query}"`);
          return { success: true, results };
        }
      }
    } catch (error: any) {
      logger.error(`❌ YouTube Data API failed: ${error.message}`);
    }
  }

  // --- Final Fallback: Curated songs ---
  logger.warn(`⚠️ All search methods failed for "${query}". Returning curated fallback.`);
  return {
    success: true,
    results: FALLBACK_VIDEOS,
    message: 'Showing curated videos (search service unavailable)',
  };
};
