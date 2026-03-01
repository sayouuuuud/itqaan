import { Extension } from '@tiptap/core';

export const FontFamily = Extension.create({
  name: 'fontFamily',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => ({
              fontFamily: element.style.fontFamily?.replace(/['"]/g, ''),
            }),
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) {
                return {};
              }
              return {
                style: `font-family: ${attributes.fontFamily}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily: string) =>
        ({ commands }) => {
          return commands.setMark('textStyle', { fontFamily });
        },
      unsetFontFamily:
        () =>
        ({ commands }) => {
          return commands.setMark('textStyle', { fontFamily: null });
        },
    };
  },
});
