export 
function UpcomingLesson() {
 
  return ( <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
<h3 className="font-bold text-lg mb-4">
الدرس القادم</h3>
<div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
 <div className="flex justify-between items-start mb-2">
<span className="bg-surface text-orange-600 text-xs font-bold px-2 py-1 rounded shadow-sm">
 مباشر </span>
<span className="text-xs text-text-muted">
اليوم، 7:30 م</span>
</div>

 <h4 className="font-bold text-lg text-foreground mb-1">
مجلس الفقه</h4>
<p className="text-sm text-text-muted">
 شرح كتاب &quot;
منهاج الطالبين&quot;
 للإمام النووي </p>
</div>

 <button className="w-full bg-transparent border border-border hover:border-primary hover:text-primary text-text-muted font-medium py-2 rounded-lg transition-colors text-sm">
 إدارة الجدول </button>
</div>

 ) }
