"use client"

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">صفحة ديبج محرر النصوص</h1>
        
        <div className="bg-card rounded-lg p-6 mb-6 border">
          <h2 className="text-lg font-semibold mb-4">الأداة تم إزالتها</h2>
          <p className="text-sm text-text-muted mb-4">
            أداة الديبج تم إزالتها من هذه الصفحة لأنها لم تعمل بشكل صحيح.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">كيفية تحليل مشكلة الفونت:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>اذهب إلى صفحة الإضافة (مقال/خطبة/درس)</li>
              <li>افتح أدوات المطور في المتصفح (F12)</li>
              <li>اذهب إلى تبويب Console</li>
              <li>اكتب هذه الأوامر:</li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  // تحقق من محرر النصوص<br/>
                  document.querySelectorAll('.ProseMirror')<br/>
                  document.querySelectorAll('[contenteditable="true"]')<br/>
                  <br/>
                  // تحقق من محدد الفونت<br/>
                  document.querySelectorAll('select')<br/>
                  <br/>
                  // تحقق من HTML content<br/>
                  document.querySelector('.ProseMirror')?.innerHTML
                </code>
              </li>
              <li>انسخ النتائج هنا لتحليلها</li>
            </ol>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-lg font-semibold mb-4">روابط سريعة:</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a 
              href="/admin/articles" 
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors text-center"
            >
              إضافة مقال
            </a>
            <a 
              href="/admin/khutba" 
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors text-center"
            >
              إضافة خطبة
            </a>
            <a 
              href="/admin/dars" 
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors text-center"
            >
              إضافة درس
            </a>
            <a 
              href="/admin/books" 
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors text-center"
            >
              إضافة كتاب
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
