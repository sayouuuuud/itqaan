import { Node } from '@tiptap/core';

export interface VerseBlockquoteAttrs {
  verseText: string;
  surahName: string;
  surahNumber: number;
  verseNumber: number;
}

export const VerseBlockquote = Node.create({
  name: 'verseBlockquote',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      verseText: {
        default: '',
      },
      surahName: {
        default: '',
      },
      surahNumber: {
        default: 0,
      },
      verseNumber: {
        default: 0,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'blockquote.quran-verse',
        getAttrs: (el) => {
          const element = el as HTMLElement;
          return {
            verseText: element.getAttribute('data-verse-text') || '',
            surahName: element.getAttribute('data-surah-name') || '',
            surahNumber: parseInt(element.getAttribute('data-surah-number') || '0', 10),
            verseNumber: parseInt(element.getAttribute('data-verse-number') || '0', 10),
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const { verseText, surahName, surahNumber, verseNumber } = node.attrs as VerseBlockquoteAttrs;

    return [
      'blockquote',
      {
        class: 'quran-verse border-r-4 border-secondary bg-secondary/5 p-4 rounded-l-lg not-italic text-xl font-body leading-relaxed text-gray-700 dark:text-gray-300 my-8',
        'data-verse-text': verseText,
        'data-surah-name': surahName,
        'data-surah-number': surahNumber.toString(),
        'data-verse-number': verseNumber.toString(),
      },
      ['p', { class: 'mb-2' }, verseText],
      surahName && verseNumber
        ? [
            'footer',
            {
              class: 'mt-2 text-sm text-gray-500 dark:text-gray-400 font-display',
            },
            `- ${surahName}:${verseNumber}`,
          ]
        : [],
    ];
  },
});
