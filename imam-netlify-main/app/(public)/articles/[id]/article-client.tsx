"use client"

import { ShareButtons } from "@/components/share-buttons"
import { SafeHtml } from "@/components/ui/safe-html"
import { AudioPlayer } from "@/components/audio-player"
import { NewsletterForm } from "@/components/newsletter-form"
import { Mic, Clock, Eye, Music, Play, FileText, Printer, Share, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface ArticleClientProps {
  article: any
  articleWithImageUrls: any
  processedRelatedArticles: any[]
}

export default function ArticleClient({
  article,
  articleWithImageUrls,
  processedRelatedArticles
}: ArticleClientProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  const [contentElement, setContentElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Set content element for PDF export
    setTimeout(() => {
      const element = document.getElementById('article-content')
      setContentElement(element)
    }, 100)
  }, [])

  return (
    <>
      {/* Audio Player */}
      {article.audio_url && (
        <AudioPlayer
          src={article.audio_url.startsWith("uploads/") ? `/api/download?key=${encodeURIComponent(article.audio_url)}` : article.audio_url}
          title={article.title}
          className="no-print"
        />
      )}

      {/* Article Content */}
      <article className="prose prose-lg dark:prose-invert prose-headings:font-display prose-p:font-body max-w-none bg-card-light dark:bg-card-dark p-8 md:p-12 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
        <h3 className="flex items-center gap-2">
          <span className="w-1 h-8 bg-secondary rounded-full"></span>
          مقدمة المقال
        </h3>

        <p>
          الحمد لله رب العالمين، والصلاة والسلام على أشرف الأنبياء والمرسلين، نبينا محمد وعلى آله وصحبه أجمعين. أما بعد، فإن الله سبحانه وتعالى قد خلق الإنسان مدنياً بطبعه، لا يستغني عن أخيه الإنسان في شؤون حياته كلها. وقد جاء الإسلام ليؤكد هذا المعنى ويرسخه في نفوس أتباعه، فجعل رابطة الإيمان أقوى الروابط وأوثقها.
        </p>

        <div className="ornament-divider">
          <span className="material-icons-outlined text-2xl">local_florist</span>
        </div>

        <h3>المحتوى العلمي</h3>

        <p>
          إن للعلم مظاهر عديدة في حياتنا اليومية، منها:
        </p>

        <ul className="list-none space-y-2 p-0">
          <li className="flex items-start gap-3">
            <CheckCircle className="text-secondary mt-1 flex-shrink-0" size={20} />
            <span>البحث العلمي والتفكر في آيات الله</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="text-secondary mt-1 flex-shrink-0" size={20} />
            <span>طلب العلم النافع والعمل به</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="text-secondary mt-1 flex-shrink-0" size={20} />
            <span>نشر العلم وتعليمه للآخرين</span>
          </li>
        </ul>

        <div className="ornament-divider">
          <span className="material-icons-outlined text-2xl">local_florist</span>
        </div>

        <h3>الخاتمة</h3>

        <p>
          فلنحرص عباد الله على تحقيق هذا المعنى العظيم في حياتنا، ولنكن كالجسد الواحد إذا اشتكى منه عضو تداعى له سائر الجسد بالسهر والحمى. نسأل الله أن يجمع قلوبنا على طاعته، وأن يوحد صفوفنا على الحق. أقول قولي هذا وأستغفر الله لي ولكم.
        </p>

        {/* Article Content from Database */}
        {article.content && (
          <SafeHtml
            html={article.content}
            className="font-body text-lg leading-loose mt-8"
          />
        )}
      </article>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <Link href="#" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors">
          #العلم_الشرعي
        </Link>
        <Link href="#" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors">
          #المقالات_العلمية
        </Link>
        <Link href="#" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors">
          #الفقه_الإسلامي
        </Link>
        <Link href="#" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors">
          #الحديث_الشريف
        </Link>
      </div>

      {/* Share Buttons */}
      <div className="mb-12 pb-12 border-b border-border no-print">
        <h3 className="font-bold text-foreground mb-4">مشاركة المقال</h3>
        <ShareButtons
          title={article.title}
          content={article.content}
          author={article.author}
          readTime={article.read_time}
        />
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-8">
        {/* Author Card */}
        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 dark:bg-gray-700 mb-4 overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
            <img
              alt="صورة الكاتب"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD93NFhPvk_9GOC6WYioUfVJ91vtVgcYdlZFAfn006RA6u4jXb8fkV5Ji5uFjaqSO6TpA4T80XjB-tMwFFBOKZdQLs2W6N8gFottatEJYfWrKNSwlkJCpqi_j4L54KiFGH6OeRCCSLMhXx77n28XyX5hXyLflQGxmIe41hKa6Sftu3dkmT5DDYa4ZeV-rSnRBsuFxcYO8JxzEnpP36S5ZYHbnGObS3i8NzTTR8d8VjgCYEKgFh40ILXoyT95U7LZCzepdMXYWbqRw2L/"
            />
          </div>
          <h3 className="text-xl font-bold text-card-foreground mb-1">
            {article.author}
          </h3>
          <p className="text-secondary text-sm mb-4">
            كاتب وباحث إسلامي
          </p>
          <button className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors text-sm">
            عرض الملف الشخصي
          </button>
        </div>

        {/* Related Articles */}
        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-card-foreground flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              مقالات ذات صلة
            </h3>
          </div>
          <div className="space-y-4">
            {processedRelatedArticles.slice(0, 3).map((relatedArticle) => (
              <Link
                key={relatedArticle.id}
                href={`/articles/${relatedArticle.id}`}
                className="group block"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-800 shrink-0 overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/40 transition-colors flex items-center justify-center">
                      <span className="material-icons-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        article
                      </span>
                    </div>
                    {relatedArticle.featuredImageUrl ? (
                      <img
                        src={relatedArticle.featuredImageUrl}
                        alt={relatedArticle.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-icons-outlined text-gray-400">article</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-secondary transition-colors text-sm leading-snug mb-1">
                      {relatedArticle.title}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span className="material-icons-outlined text-[12px]">schedule</span>
                      {formatDate(relatedArticle.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/articles"
            className="block text-center text-primary dark:text-secondary text-sm font-bold mt-6 hover:underline"
          >
            عرض المزيد من المقالات
          </Link>
        </div>

        {/* Newsletter Subscription */}
        <div className="bg-primary text-white rounded-xl p-6 relative overflow-hidden">
          <span className="material-icons-outlined absolute -bottom-8 -left-8 text-9xl text-white opacity-10">
            mail_outline
          </span>
          <h3 className="font-bold text-lg mb-2 relative z-10">
            اشترك في القائمة البريدية
          </h3>
          <p className="text-primary-100 text-sm mb-4 relative z-10 opacity-90">
            احصل على أحدث المقالات والدراسات مباشرة إلى بريدك الإلكتروني.
          </p>
          <NewsletterForm />
        </div>
      </div>
    </>
  )
}

import { ShareButtons } from "@/components/share-buttons"
import { SafeHtml } from "@/components/ui/safe-html"
import { AudioPlayer } from "@/components/audio-player"
import { NewsletterForm } from "@/components/newsletter-form"
import { Mic, Clock, Eye, Music, Play, FileText, Printer, Share, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface ArticleClientProps {
  article: any
  articleWithImageUrls: any
  processedRelatedArticles: any[]
}

export default function ArticleClient({
  article,
  articleWithImageUrls,
  processedRelatedArticles
}: ArticleClientProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  const [contentElement, setContentElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Set content element for PDF export
    setTimeout(() => {
      const element = document.getElementById('article-content')
      setContentElement(element)
    }, 100)
  }, [])

  return (
    <>
      {/* Audio Player */}
      {article.audio_url && (
        <AudioPlayer
          src={article.audio_url.startsWith("uploads/") ? `/api/download?key=${encodeURIComponent(article.audio_url)}` : article.audio_url}
          title={article.title}
          className="no-print"
        />
      )}

      {/* Article Content */}
      <article className="prose prose-lg dark:prose-invert prose-headings:font-display prose-p:font-body max-w-none bg-card-light dark:bg-card-dark p-8 md:p-12 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
        <h3 className="flex items-center gap-2">
          <span className="w-1 h-8 bg-secondary rounded-full"></span>
          مقدمة المقال
        </h3>

        <p>
          الحمد لله رب العالمين، والصلاة والسلام على أشرف الأنبياء والمرسلين، نبينا محمد وعلى آله وصحبه أجمعين. أما بعد، فإن الله سبحانه وتعالى قد خلق الإنسان مدنياً بطبعه، لا يستغني عن أخيه الإنسان في شؤون حياته كلها. وقد جاء الإسلام ليؤكد هذا المعنى ويرسخه في نفوس أتباعه، فجعل رابطة الإيمان أقوى الروابط وأوثقها.
        </p>

        <div className="ornament-divider">
          <span className="material-icons-outlined text-2xl">local_florist</span>
        </div>

        <h3>المحتوى العلمي</h3>

        <p>
          إن للعلم مظاهر عديدة في حياتنا اليومية، منها:
        </p>

        <ul className="list-none space-y-2 p-0">
          <li className="flex items-start gap-3">
            <CheckCircle className="text-secondary mt-1 flex-shrink-0" size={20} />
            <span>البحث العلمي والتفكر في آيات الله</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="text-secondary mt-1 flex-shrink-0" size={20} />
            <span>طلب العلم النافع والعمل به</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="text-secondary mt-1 flex-shrink-0" size={20} />
            <span>نشر العلم وتعليمه للآخرين</span>
          </li>
        </ul>

        <div className="ornament-divider">
          <span className="material-icons-outlined text-2xl">local_florist</span>
        </div>

        <h3>الخاتمة</h3>

        <p>
          فلنحرص عباد الله على تحقيق هذا المعنى العظيم في حياتنا، ولنكن كالجسد الواحد إذا اشتكى منه عضو تداعى له سائر الجسد بالسهر والحمى. نسأل الله أن يجمع قلوبنا على طاعته، وأن يوحد صفوفنا على الحق. أقول قولي هذا وأستغفر الله لي ولكم.
        </p>

        {/* Article Content from Database */}
        {article.content && (
          <SafeHtml
            html={article.content}
            className="font-body text-lg leading-loose mt-8"
          />
        )}
      </article>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <Link href="#" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors">
          #العلم_الشرعي
        </Link>
        <Link href="#" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors">
          #المقالات_العلمية
        </Link>
        <Link href="#" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors">
          #الفقه_الإسلامي
        </Link>
        <Link href="#" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors">
          #الحديث_الشريف
        </Link>
      </div>

      {/* Share Buttons */}
      <div className="mb-12 pb-12 border-b border-border no-print">
        <h3 className="font-bold text-foreground mb-4">مشاركة المقال</h3>
        <ShareButtons
          title={article.title}
          content={article.content}
          author={article.author}
          readTime={article.read_time}
        />
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-8">
        {/* Author Card */}
        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 dark:bg-gray-700 mb-4 overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
            <img
              alt="صورة الكاتب"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD93NFhPvk_9GOC6WYioUfVJ91vtVgcYdlZFAfn006RA6u4jXb8fkV5Ji5uFjaqSO6TpA4T80XjB-tMwFFBOKZdQLs2W6N8gFottatEJYfWrKNSwlkJCpqi_j4L54KiFGH6OeRCCSLMhXx77n28XyX5hXyLflQGxmIe41hKa6Sftu3dkmT5DDYa4ZeV-rSnRBsuFxcYO8JxzEnpP36S5ZYHbnGObS3i8NzTTR8d8VjgCYEKgFh40ILXoyT95U7LZCzepdMXYWbqRw2L/"
            />
          </div>
          <h3 className="text-xl font-bold text-card-foreground mb-1">
            {article.author}
          </h3>
          <p className="text-secondary text-sm mb-4">
            كاتب وباحث إسلامي
          </p>
          <button className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors text-sm">
            عرض الملف الشخصي
          </button>
        </div>

        {/* Related Articles */}
        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-card-foreground flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              مقالات ذات صلة
            </h3>
          </div>
          <div className="space-y-4">
            {processedRelatedArticles.slice(0, 3).map((relatedArticle) => (
              <Link
                key={relatedArticle.id}
                href={`/articles/${relatedArticle.id}`}
                className="group block"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-800 shrink-0 overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/40 transition-colors flex items-center justify-center">
                      <span className="material-icons-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        article
                      </span>
                    </div>
                    {relatedArticle.featuredImageUrl ? (
                      <img
                        src={relatedArticle.featuredImageUrl}
                        alt={relatedArticle.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-icons-outlined text-gray-400">article</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-secondary transition-colors text-sm leading-snug mb-1">
                      {relatedArticle.title}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span className="material-icons-outlined text-[12px]">schedule</span>
                      {formatDate(relatedArticle.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/articles"
            className="block text-center text-primary dark:text-secondary text-sm font-bold mt-6 hover:underline"
          >
            عرض المزيد من المقالات
          </Link>
        </div>

        {/* Newsletter Subscription */}
        <div className="bg-primary text-white rounded-xl p-6 relative overflow-hidden">
          <span className="material-icons-outlined absolute -bottom-8 -left-8 text-9xl text-white opacity-10">
            mail_outline
          </span>
          <h3 className="font-bold text-lg mb-2 relative z-10">
            اشترك في القائمة البريدية
          </h3>
          <p className="text-primary-100 text-sm mb-4 relative z-10 opacity-90">
            احصل على أحدث المقالات والدراسات مباشرة إلى بريدك الإلكتروني.
          </p>
          <NewsletterForm />
        </div>
      </div>
    </>
  )
}
