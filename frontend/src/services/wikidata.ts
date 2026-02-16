import axios from 'axios';
import { TagEntity } from '@/types';

// Use relative URL /api to leverage nginx proxy, or absolute URL if provided via env var
const getApiBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    let url = envUrl.trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    // Only force HTTPS for production URLs (not localhost)
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
    if (url.startsWith('http://') && !isLocalhost) {
      console.warn('VITE_API_URL uses HTTP for production. Forcing HTTPS.');
      url = url.replace('http://', 'https://');
    }
    return url;
  }
  return "/api";
};

const API_BASE_URL = getApiBaseUrl();

interface WikidataSearchResponse {
  query: string;
  language: string;
  results: TagEntity[];
  count: number;
}

let searchTimeout: NodeJS.Timeout | null = null;

/**
 * Search WikiData entities with debouncing
 * @param query Search query string
 * @param language Language code (default: "en")
 * @param limit Maximum number of results (default: 10)
 * @param debounceMs Debounce delay in milliseconds (default: 300)
 * @returns Promise resolving to list of TagEntity objects
 */
export async function searchWikidataEntities(
  query: string,
  language: string = "en",
  limit: number = 10,
  debounceMs: number = 300
): Promise<TagEntity[]> {
  return new Promise((resolve, reject) => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // If query is empty, return empty array immediately
    if (!query || !query.trim()) {
      resolve([]);
      return;
    }

    // Set up debounced search
    searchTimeout = setTimeout(async () => {
      try {
        const response = await axios.get<WikidataSearchResponse>(
          `${API_BASE_URL}/wikidata/search`,
          {
            params: {
              query: query.trim(),
              language,
              limit,
            },
          }
        );

        const results: TagEntity[] = response.data.results?.map((result: any) => {
          const label = result.titleSnippet?.replace(/<[^>]*>?/g, '');
          return {
            label: label || result.label || undefined,
            entityId: result.pageId,
            description: result.description || undefined,
            aliases: result.aliases || [],
          };
        })?.filter((result: TagEntity) => result?.label) as TagEntity[] ?? [];

        resolve(results);
      } catch (error: any) {
        console.error('Error searching WikiData:', error);
        // Return empty array on error instead of rejecting
        // This allows the UI to continue working even if WikiData is unavailable
        resolve([]);
      }
    }, debounceMs);
  });
}

/**
 * Search WikiData entities without debouncing (for immediate searches)
 * @param query Search query string
 * @param language Language code (default: "en")
 * @param limit Maximum number of results (default: 10)
 * @returns Promise resolving to list of TagEntity objects
 */
export async function searchWikidataEntitiesImmediate(
  query: string,
  language: string = "en",
  limit: number = 10
): Promise<TagEntity[]> {
  if (!query || !query.trim()) {
    return [];
  }

  try {
    const response = await axios.get<WikidataSearchResponse>(
      `${API_BASE_URL}/wikidata/search`,
      {
        params: {
          query: query.trim(),
          language,
          limit,
        },
      }
    );

    return response.data.results || [];
  } catch (error: any) {
    console.error('Error searching WikiData:', error);
    return [];
  }
}

