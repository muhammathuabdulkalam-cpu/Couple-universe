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
  {
    videoId: 'b68HETiNO98',
    title: 'Sai Abhyankkar - Pavazha Malli (Music Video) | Think Indie',
    description: 'Official Music Video',
    thumbnail: 'https://img.youtube.com/vi/b68HETiNO98/0.jpg',
    channelTitle: 'Think Music India',
    publishedAt: new Date().toISOString(),
  },
  {
    videoId: 'YxWlaYCA8MU',
    title: 'Kaavaalaa - Jailer | Rajinikanth | Anirudh Ravichander',
    description: 'Official Video Song of Kaavaalaa',
    thumbnail: 'https://img.youtube.com/vi/YxWlaYCA8MU/0.jpg',
    channelTitle: 'Sun TV',
    publishedAt: new Date().toISOString(),
  },
  {
    videoId: '0G2VnuLzjAO',
    title: 'Hukum - Jailer | Rajinikanth | Anirudh Ravichander',
    description: 'Official Lyric Video',
    thumbnail: 'https://img.youtube.com/vi/0G2VnuLzjAO/0.jpg',
    channelTitle: 'Sun TV',
    publishedAt: new Date().toISOString(),
  },
  {
    videoId: 'C6689d0wX4I',
    title: 'Arabic Kuthu - Halamithi Habibo | Beast | Thalapathy Vijay',
    description: 'Official Video Song',
    thumbnail: 'https://img.youtube.com/vi/C6689d0wX4I/0.jpg',
    channelTitle: 'Sun TV',
    publishedAt: new Date().toISOString(),
  },
];

/**
 * Tier 1: YouTube InnerTube API with Full YouTube Headers & Regional Context
 */
async function searchViaInnerTube(query: string): Promise<YouTubeSearchResult[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20240301.00.00',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240301.00.00',
            hl: 'en',
            gl: 'IN',
            utcOffsetMinutes: 330,
          },
        },
        query,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      logger.warn(`⚠️ InnerTube returned HTTP ${res.status}`);
      return [];
    }

    const data: any = await res.json();
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    const results: YouTubeSearchResult[] = [];

    if (Array.isArray(contents)) {
      for (const sec of contents) {
        const itemSection = sec?.itemSectionRenderer?.contents || [];
        for (const item of itemSection) {
          const video = item?.videoRenderer;
          if (video && video.videoId) {
            const thumbs: any[] = video.thumbnail?.thumbnails || [];
            const bestThumb =
              thumbs.slice(-1)[0]?.url || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;

            results.push({
              videoId: video.videoId,
              title: video.title?.runs?.[0]?.text || 'Untitled Video',
              description: video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.[0]?.text || '',
              thumbnail: bestThumb,
              channelTitle: video.ownerText?.runs?.[0]?.text || 'YouTube Channel',
              publishedAt: video.publishedTimeText?.simpleText || new Date().toISOString(),
            });
          }
        }
      }
    }

    return results;
  } catch (err: any) {
    logger.warn(`⚠️ InnerTube search failed: ${err.message}`);
    return [];
  }
}

/**
 * Tier 2: Direct YouTube HTML Scraper (`ytInitialData`)
 */
async function searchViaDirectScrape(query: string): Promise<YouTubeSearchResult[]> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (!match || !match[1]) return [];

    const data = JSON.parse(match[1]);
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    const results: YouTubeSearchResult[] = [];

    if (Array.isArray(contents)) {
      for (const sec of contents) {
        const itemSection = sec?.itemSectionRenderer?.contents || [];
        for (const item of itemSection) {
          const video = item?.videoRenderer;
          if (video && video.videoId) {
            results.push({
              videoId: video.videoId,
              title: video.title?.runs?.[0]?.text || 'Untitled Video',
              description: '',
              thumbnail:
                video.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                `https://img.youtube.com/vi/${video.videoId}/0.jpg`,
              channelTitle: video.ownerText?.runs?.[0]?.text || 'YouTube Channel',
              publishedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    return results;
  } catch (err: any) {
    logger.warn(`⚠️ Direct Scrape search failed: ${err.message}`);
    return [];
  }
}

/**
 * Tier 3: youtube-search-api package
 */
async function searchViaNpmPackage(query: string): Promise<YouTubeSearchResult[]> {
  try {
    const searchResponse = await YoutubeSearchApi.GetListByKeyword(query, false, 25);
    const items: any[] = searchResponse?.items || [];

    return items
      .filter((item: any) => item.type === 'video' && item.id)
      .map((item: any) => {
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
  } catch (err: any) {
    logger.warn(`⚠️ youtube-search-api package search failed: ${err.message}`);
    return [];
  }
}

/**
 * Tier 4: Official YouTube Data API v3 (if YOUTUBE_API_KEY is provided)
 */
async function searchViaDataApi(query: string, apiKey: string): Promise<YouTubeSearchResult[]> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&q=${encodeURIComponent(
      query
    )}&key=${apiKey}`;
    const response = await fetch(url);
    const data: any = await response.json();

    if (response.ok && !data.error && data.items?.length > 0) {
      return data.items
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
    }
    return [];
  } catch (err: any) {
    logger.error(`❌ YouTube Data API failed: ${err.message}`);
    return [];
  }
}

/**
 * Multi-Tiered Resilient YouTube Video Search
 */
export const searchYouTubeVideos = async (
  query: string
): Promise<{ success: boolean; results: YouTubeSearchResult[]; message?: string }> => {
  const apiKey = env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

  // Tier 1: YouTube InnerTube API
  logger.info(`🔍 Searching YouTube for: "${query}" via InnerTube API`);
  let results = await searchViaInnerTube(query);
  if (results.length > 0) {
    logger.info(`✅ InnerTube returned ${results.length} live results for: "${query}"`);
    return { success: true, results };
  }

  // Tier 2: Direct Web Scraper
  logger.info(`🔍 Trying Direct Web Scraper for: "${query}"`);
  results = await searchViaDirectScrape(query);
  if (results.length > 0) {
    logger.info(`✅ Direct Scraper returned ${results.length} live results for: "${query}"`);
    return { success: true, results };
  }

  // Tier 3: youtube-search-api package
  logger.info(`🔍 Trying youtube-search-api package for: "${query}"`);
  results = await searchViaNpmPackage(query);
  if (results.length > 0) {
    logger.info(`✅ youtube-search-api package returned ${results.length} live results for: "${query}"`);
    return { success: true, results };
  }

  // Tier 4: YouTube Data API v3 (if key provided)
  if (apiKey && apiKey.trim()) {
    logger.info(`🔍 Trying YouTube Data API v3 for: "${query}"`);
    results = await searchViaDataApi(query, apiKey);
    if (results.length > 0) {
      logger.info(`✅ YouTube Data API v3 returned ${results.length} results for: "${query}"`);
      return { success: true, results };
    }
  }

  // Tier 5: Extended Fallback Catalog
  logger.warn(`⚠️ Remote YouTube search APIs unavailable for "${query}". Returning fallback catalog.`);
  return {
    success: true,
    results: FALLBACK_VIDEOS,
    message: 'Showing curated catalog (search service fallback)',
  };
};
