/**
 * Arabic → Latin transliteration helper
 * Uses the `transliteration` npm package as the engine,
 * with a hand-tuned override dictionary for common Arabic names.
 */
import { transliterate as libTransliterate } from 'transliteration'

// ─── Override dictionary ──────────────────────────────────────────────────────
// Word-level overrides for names that the generic engine gets wrong.
const nameOverrides: Record<string, string> = {
  // Compounds
  'عبدالله': 'Abdullah',
  'عبد الله': 'Abdullah',
  'عبدالرحمن': 'Abdulrahman',
  'عبد الرحمن': 'Abdulrahman',
  'عبدالعزيز': 'Abdulaziz',
  'عبد العزيز': 'Abdulaziz',
  'عبدالكريم': 'Abdulkarim',
  'عبد الكريم': 'Abdulkarim',
  'عبدالرحيم': 'Abdulrahim',
  'عبد الرحيم': 'Abdulrahim',
  'عبدالمجيد': 'Abdulmajeed',
  'عبد المجيد': 'Abdulmajeed',

  // Males
  'محمد': 'Mohamed',
  'محمود': 'Mahmoud',
  'أحمد': 'Ahmed',
  'احمد': 'Ahmed',
  'إبراهيم': 'Ibrahim',
  'ابراهيم': 'Ibrahim',
  'إسماعيل': 'Ismail',
  'اسماعيل': 'Ismail',
  'يوسف': 'Youssef',
  'خالد': 'Khaled',
  'مؤمن': 'Moamen',
  'طارق': 'Tarek',
  'عمر': 'Omar',
  'عمرو': 'Amr',
  'علي': 'Ali',
  'حسين': 'Hussein',
  'حسن': 'Hassan',
  'ياسر': 'Yasser',
  'وليد': 'Walid',
  'سعد': 'Saad',
  'زياد': 'Ziad',
  'ناصر': 'Nasser',
  'سلطان': 'Sultan',
  'نواف': 'Nawaf',
  'بندر': 'Bandar',
  'سعود': 'Saud',
  'سيد': 'Sayed',
  'السيد': 'El-Sayed',
  'مصطفى': 'Mostafa',
  'مصطفي': 'Mostafa',
  'عثمان': 'Osman',
  'اسامة': 'Osama',
  'أسامة': 'Osama',
  'كريم': 'Karim',
  'حازم': 'Hazem',
  'وائل': 'Wael',
  'تامر': 'Tamer',
  'هشام': 'Hesham',
  'اشرف': 'Ashraf',
  'أشرف': 'Ashraf',
  'أكرم': 'Akram',
  'عادل': 'Adel',
  'مروان': 'Marwan',
  'ماجد': 'Majed',
  'أيمن': 'Ayman',
  'ايمن': 'Ayman',
  'إيهاب': 'Ehab',
  'ايهاب': 'Ehab',
  'بهاء': 'Bahaa',
  'يحيى': 'Yehia',
  'يحيي': 'Yehia',
  'عيسى': 'Eissa',
  'موسى': 'Moussa',
  'طه': 'Taha',
  'حمزة': 'Hamza',
  'ياسين': 'Yassin',
  'فيصل': 'Faisal',
  'رامي': 'Rami',
  'رامى': 'Rami',
  'سامي': 'Sami',
  'سامى': 'Sami',
  'شريف': 'Sherif',
  'جمال': 'Gamal',
  'نبيل': 'Nabil',
  'مجدي': 'Magdy',
  'مجدى': 'Magdy',
  'عصام': 'Essam',
  'صلاح': 'Salah',
  'فتحي': 'Fathy',
  'فتحى': 'Fathy',

  // Females
  'ريم': 'Reem',
  'نور': 'Nour',
  'سارة': 'Sarah',
  'ساره': 'Sarah',
  'فاطمة': 'Fatma',
  'فاطمه': 'Fatma',
  'مريم': 'Maryam',
  'عائشة': 'Aisha',
  'زينب': 'Zeinab',
  'هند': 'Hind',
  'رنا': 'Rana',
  'لينا': 'Lina',
  'منى': 'Mona',
  'سمر': 'Samar',
  'أسماء': 'Asmaa',
  'اسماء': 'Asmaa',
  'رهف': 'Rahaf',
  'دانة': 'Dana',
  'شهد': 'Shahd',
  'ملك': 'Malak',
  'مى': 'Mai',
  'مي': 'Mai',
  'ندى': 'Nada',
  'اميرة': 'Amira',
  'أميرة': 'Amira',
  'دينا': 'Dina',
  'داليا': 'Dalia',
  'هبة': 'Heba',
  'هبه': 'Heba',
  'ياسمين': 'Yasmine',
  'نورهان': 'Nourhan',
  'روان': 'Rawan',
  'اية': 'Aya',
  'آية': 'Aya',
  'ايه': 'Aya',
  'آيه': 'Aya',
  'حبيبة': 'Habiba',
  'شروق': 'Shorouk',
  'نهى': 'Noha',
  'نهي': 'Noha',
  'رانيا': 'Rania',
  'هالة': 'Hala',
  'هاله': 'Hala',
  'سهير': 'Sohair',
  'سميرة': 'Samira',
  'سميره': 'Samira',
  'نادية': 'Nadia',
  'ناديه': 'Nadia',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check whether a string contains Arabic characters
 */
export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text)
}

/**
 * Transliterate an Arabic name to Latin script.
 * If the input has no Arabic characters, returns it as-is (title-cased).
 *
 * Strategy:
 *  1. Check whole-name override dict
 *  2. Split by space, check each word in override dict
 *  3. Fall back to the `transliteration` npm lib for unknown words (handles
 *     Unicode → Latin phonetically far better than a hand-rolled char map)
 */
export function transliterate(name: string): string {
  if (!containsArabic(name)) return name

  // Normalize: strip extra spaces + diacritics (tashkeel)
  const normalized = name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u064B-\u065F\u0670]/g, '')

  // 1. Whole-name override
  if (nameOverrides[normalized]) return nameOverrides[normalized]

  // 2. Word-by-word
  const words = normalized.split(' ')
  const result = words.map(word => {
    if (nameOverrides[word]) return nameOverrides[word]

    // 3. Library fallback - produces e.g. "Syd" → "Sd" for non-vocalized text,
    //    so we still rely on override first, but this is better than a raw char map
    const libResult = libTransliterate(word)
    // Capitalize first letter, lowercase rest
    return libResult.charAt(0).toUpperCase() + libResult.slice(1).toLowerCase()
  })

  return result.join(' ')
}
