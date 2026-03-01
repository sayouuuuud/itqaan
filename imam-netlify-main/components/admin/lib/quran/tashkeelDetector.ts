export const TASHKEEL_REGEX = /[\u064B-\u065F\u0670]/;

export const ARABIC_TEXT_REGEX = /[\u0600-\u06FF\u064B-\u065F\u0670]+/g;

export const VERSE_EXTRACTION_REGEX = /[\u0600-\u06FF\u064B-\u065F\u0670\s]+/g;

export function hasTashkeel(text: string): boolean {
  return TASHKEEL_REGEX.test(text);
}

export function extractArabicText(text: string): string[] {
  const matches = text.match(ARABIC_TEXT_REGEX);
  return matches || [];
}

export function extractVerseText(text: string): string {
  const segments = text.match(VERSE_EXTRACTION_REGEX) || [];
  return segments.join(' ').trim();
}

export function detectVerseWithTashkeel(insertedText: string): {
  hasTashkeel: boolean;
  verseText: string;
} {
  const detectedTashkeel = hasTashkeel(insertedText);
  const verseText = detectedTashkeel ? extractVerseText(insertedText) : '';

  return {
    hasTashkeel: detectedTashkeel,
    verseText,
  };
}
