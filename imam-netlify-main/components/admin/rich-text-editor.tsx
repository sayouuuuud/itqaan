"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { Node } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useRef, useState } from "react"
import { Palette, Type, Sparkles, SeparatorVertical, BookOpen, ChevronDown } from "lucide-react"
import { VerseBlockquote } from "@/lib/quran/VerseBlockquote"
import { FontFamily } from "@/lib/quran/FontExtension"
import { FontSize } from "@/lib/quran/FontSizeExtension"
import type { VerseBlockquoteAttrs } from "@/lib/quran/VerseBlockquote"

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  onFontChange?: (font: string) => void
  defaultFont?: string
  placeholder?: string
}

const TEXT_COLORS = [{ name: "أسود", value: "#000000" }, { name: "أبيض", value: "#FFFFFF" }, { name: "رمادي", value: "#6B7280" }, { name: "أحمر", value: "#DC2626" }, { name: "برتقالي", value: "#EA580C" }, { name: "أصفر", value: "#CA8A04" }, { name: "أخضر", value: "#16A34A" }, { name: "أزرق", value: "#2563EB" }, { name: "بنفسجي", value: "#9333EA" }, { name: "وردي", value: "#DB2777" }, { name: "سماوي", value: "#0891B2" }, { name: "ذهبي", value: "#B45309" },
]

const FONT_FAMILIES = [
  { name: "Cairo", value: '"Cairo", sans-serif' },
  { name: "Amiri", value: '"Amiri", serif' },
]

const FONT_SIZES = [
  { name: "صغير جداً", value: "12px" },
  { name: "صغير", value: "14px" },
  { name: "عادي", value: "16px" },
  { name: "متوسط", value: "18px" },
  { name: "كبير", value: "20px" },
  { name: "كبير جداً", value: "24px" },
  { name: "ضخم", value: "28px" },
  { name: "عنوان", value: "32px" },
]

// Custom extension for ornament divider
const OrnamentDivider = Node.create({
  name: 'ornamentDivider',
  group: 'block',
  parseHTML() {
    return [{ tag: 'div.ornament-divider' }]
  },
  renderHTML() {
    return ['div', {
      class: 'ornament-divider ornament-divider-editor flex items-center justify-center my-8 text-secondary',
      style: 'color: #c8a165; position: relative; width: 100%;',
    },
      ['span', {
        class: 'material-icons-outlined text-2xl',
        style: 'z-index: 1;'
      }, 'local_florist']
    ]
  },
})

export function RichTextEditor({ content, onChange, onFontChange, defaultFont = 'Cairo', placeholder }: RichTextEditorProps) {
  const isInitialMount = useRef(true)
  const lastContent = useRef(content)
  const [selectedFont, setSelectedFont] = useState(defaultFont)
  const [quranModalOpen, setQuranModalOpen] = useState(false)
  const [quranVerse, setQuranVerse] = useState('')
  const [quranSurah, setQuranSurah] = useState('')
  const [quranNumber, setQuranNumber] = useState('')
  const [toolbarExpanded, setToolbarExpanded] = useState(false)
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      OrnamentDivider,
      VerseBlockquote,
    ],
    content: content,
    onUpdate: async ({ editor }) => {
      if (!editor) return
      const html = editor.getHTML()
      lastContent.current = html
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 bg-muted text-foreground rounded-b-lg",
        dir: "rtl",
        contenteditable: "true",
      },
    },
  })

  useEffect(() => {
    if (editor) {
      if (isInitialMount.current) {
        isInitialMount.current = false
        if (content && content !== editor.getHTML()) {
          editor.commands.setContent(content)
        }
      } else if (content !== lastContent.current && content !== editor.getHTML()) {
        editor.commands.setContent(content)
        lastContent.current = content
      }
    }
  }, [content, editor])

  const handleInsertQuranVerse = () => {
    if (!editor || !quranVerse.trim()) return

    const attrs: VerseBlockquoteAttrs = {
      verseText: quranVerse,
      surahName: quranSurah || '',
      surahNumber: 0,
      verseNumber: quranNumber ? parseInt(quranNumber, 10) : 0,
    }

    editor.chain().focus().insertContent({
      type: 'verseBlockquote',
      attrs,
    }).run()

    setQuranModalOpen(false)
    setQuranVerse('')
    setQuranSurah('')
    setQuranNumber('')
  }

  const handleInsertGoldenBullet = () => {
    if (!editor) return
    const bulletHtml = `<ul><li class="golden-list-item flex items-start gap-3"><span class="material-icons-outlined text-secondary mt-1" style="color: #c8a165; font-size: 14px;">check_circle</span><div>عنصر قائمة ذهبي</div></li></ul>`
    editor.chain().focus().insertContent(bulletHtml).run()
  }

  if (!editor) return null
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Custom styles for ornament divider, golden bullets, and Quran verses */}
      <style jsx>{`
        .quran-verse {
          border-right-width: 4px;
          border-right-color: #c8a165;
          background-color: rgba(200, 161, 101, 0.05);
          padding: 1rem;
          border-radius: 0.5rem 0 0 0.5rem;
          margin: 2rem 0;
          font-style: normal;
          font-size: 1.25rem;
          line-height: 1.75;
          color: #374151;
        }

        .dark .quran-verse {
          color: #d1d5db;
          background-color: rgba(200, 161, 101, 0.08);
        }

        .quran-verse p {
          margin-bottom: 0.5rem;
        }

        .quran-verse footer {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          font-family: 'Cairo', sans-serif;
        }

        .dark .quran-verse footer {
          color: #9ca3af;
        }

        .golden-list-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .golden-list-item span {
          flex-shrink: 0;
          margin-top: 0.25rem;
        }

        .ornament-divider::before,
        .ornament-divider::after {
          content: "";
          height: 1px;
          flex-grow: 1;
          background-color: #e5e7eb;
          margin: 0 1rem;
        }

        .dark .ornament-divider::before,
        .dark .ornament-divider::after {
          background-color: #333333;
        }

        .ornament-divider-editor::before,
        .ornament-divider-editor::after {
          position: absolute;
          left: 0;
          right: 0;
          content: "";
          height: 1px;
          background-color: #e5e7eb;
        }

        .dark .ornament-divider-editor::before,
        .dark .ornament-divider-editor::after {
          background-color: #333333;
        }

        .ornament-divider-editor::before {
          top: 50%;
          left: 0;
        }

        .ornament-divider-editor::after {
          top: 50%;
          right: 0;
        }
      `}</style>
      {/* Toolbar */}
      <div className="bg-card border-b border-border p-2 flex flex-wrap gap-1">
        {/* Font Selector */}
        <Select
          value={selectedFont}
          onValueChange={(font) => {
            setSelectedFont(font)
            if (editor) {
              editor.chain().focus().setFontFamily(FONT_FAMILIES.find(f => f.name === font)?.value || '').run()
            }
            if (onFontChange) {
              onFontChange(font)
            }
          }}
        >
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((font) => (
              <SelectItem key={font.name} value={font.name} style={{ fontFamily: font.value }}>
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Font Size Selector */}
        <Select
          value={editor.getAttributes('textStyle').fontSize || '16px'}
          onValueChange={(size) => {
            if (editor) {
              editor.chain().focus().setFontSize(size).run()
            }
          }}
        >
          <SelectTrigger className="w-20 h-8 text-xs">
            <SelectValue placeholder="حجم" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size.value} value={size.value} style={{ fontSize: size.value }}>
                {size.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Quran Verses */}
        <Dialog open={quranModalOpen} onOpenChange={setQuranModalOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              title="إدراج آية قرآنية"
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>إدراج آية قرآنية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>نص الآية</Label>
                <textarea
                  value={quranVerse}
                  onChange={(e) => setQuranVerse(e.target.value)}
                  placeholder="أدخل نص الآية..."
                  className="w-full min-h-[80px] p-2 border rounded-md resize-none"
                  dir="rtl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم السورة</Label>
                  <Input
                    value={quranSurah}
                    onChange={(e) => setQuranSurah(e.target.value)}
                    placeholder="البقرة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الآية</Label>
                  <Input
                    value={quranNumber}
                    onChange={(e) => setQuranNumber(e.target.value)}
                    placeholder="255"
                    type="number"
                  />
                </div>
              </div>
              <Button onClick={handleInsertQuranVerse} className="w-full">
                إدراج الآية
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Expandable Tools Group */}
        <Popover open={toolbarExpanded} onOpenChange={setToolbarExpanded}>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="ghost" className="relative">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              {/* Quran Verses Manual */}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQuranModalOpen(true)
                  setToolbarExpanded(false)
                }}
                title="إدراج آية قرآنية يدوياً"
                className="w-full justify-start"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                آية قرآنية
              </Button>

              {/* Golden Bullet Points */}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  handleInsertGoldenBullet()
                  setToolbarExpanded(false)
                }}
                title="قائمة ذهبية"
                className="w-full justify-start"
              >
                <Sparkles className="h-4 w-4 text-[#c8a165] mr-2" />
                قائمة ذهبية
              </Button>

              {/* Ornament Divider */}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  const dividerHtml = `<div class="ornament-divider" style="display: flex; align-items: center; justify-content: center; margin: 2rem 0; color: #c8a165;"><span class="material-icons-outlined text-2xl">local_florist</span></div>`
                  editor.chain().focus().insertContent(dividerHtml).run()
                  setToolbarExpanded(false)
                }}
                title="فاصل زخرفي"
                className="w-full justify-start"
              >
                <SeparatorVertical className="h-4 w-4 mr-2" />
                فاصل زخرفي
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          size="sm"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="font-bold"
        >
          B
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="italic"
        >
          I
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("underline") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="underline"
        >
          U
        </Button>
        <div className="w-px h-8 bg-border mx-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="ghost" className="relative">
              <Palette className="h-4 w-4" />
              <span
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
                style={{ backgroundColor: editor.getAttributes("textStyle").color || "#000000" }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.name}
                  className="w-8 h-8 rounded-md border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  onClick={() => editor.chain().focus().setColor(color.value).run()}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              إزالة اللون
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => editor.chain().focus().setColor('var(--color-foreground)').run()}
            >
              لون افتراضي
            </Button>
          </PopoverContent>
        </Popover>
        <div className="w-px h-8 bg-border mx-1" />
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Button>
        <div className="w-px h-8 bg-border mx-1" />
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("blockquote") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          "
        </Button>
        <div className="w-px h-8 bg-border mx-1" />
        <Button
          type="button"
          size="sm"
          variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <span className="material-icons-outlined text-sm">format_align_right</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <span className="material-icons-outlined text-sm">format_align_center</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <span className="material-icons-outlined text-sm">format_align_left</span>
        </Button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}

