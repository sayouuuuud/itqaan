export interface QuranCloudMatch {
  number: number;
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
  text: string;
  numberInSurah: number;
}

export interface QuranCloudApiResponse {
  code: number;
  status: string;
  data: QuranCloudMatch[] | { matches: QuranCloudMatch[] };
}

export interface VerseDetectionResult {
  detected: boolean;
  verseText: string;
  surah?: {
    name: string;
    number: number;
  };
  verse?: number;
  error?: string;
}

const API_BASE_URL = 'https://api.alquran.cloud/v1';
const API_TIMEOUT = 3000;
const DEBOUNCE_DELAY = 500;

let debounceTimer: NodeJS.Timeout | null = null;

async function fetchWithTimeout(
  url: string,
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function searchQuranVerse(
  query: string
): Promise<VerseDetectionResult> {
  if (!query.trim()) {
    return { detected: false, verseText: query };
  }

  const encodedQuery = encodeURIComponent(query);
  
  const endpoints = [
    `${API_BASE_URL}/ayahs/search?q=${encodedQuery}&language=ar`,
    `${API_BASE_URL}/ayahs/search?q=${encodedQuery}`,
    `https://api.alquran.cloud/v1/search?query=${encodedQuery}&language=ar`,
  ];

  console.log('🔍 Searching Quran API for:', query);

  for (const url of endpoints) {
    try {
      console.log('📍 Trying URL:', url);
      const response = await fetchWithTimeout(url, API_TIMEOUT);

      if (response.ok) {
        const data = (await response.json()) as any;
        console.log('📦 API Response:', data);

        if (data.code === 200 && data.data && Array.isArray(data.data) && data.data.length > 0) {
          const match = data.data[0];
          console.log('✅ Verse detected:', match.surah?.name, match.numberInSurah);

          return {
            detected: true,
            verseText: match.text,
            surah: {
              name: match.surah?.name || 'Unknown',
              number: match.surah?.number || 0,
            },
            verse: match.numberInSurah,
          };
        }
      }
    } catch (error) {
      console.log('⚠️ Endpoint failed, trying next...');
      continue;
    }
  }

  console.log('ℹ️ No matches found in any endpoint');
  return {
    detected: false,
    verseText: query,
  };
}

export function debounceVerseSearch(
  query: string,
  callback: (result: VerseDetectionResult) => void
): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    const result = await searchQuranVerse(query);
    callback(result);
    debounceTimer = null;
  }, DEBOUNCE_DELAY);
}

export function cancelPendingSearch(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
