export 
function AnnouncementBanner() {
 
  return ( <div className="bg-primary rounded-3xl p-8 relative overflow-hidden text-white shadow-lg">
 {/* Background Pattern */} <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
<svg width="100%" height="100%">
 <pattern id="admin-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
<circle cx="20" cy="20" r="2" fill="currentColor" />
 </pattern>
<rect x="0" y="0" width="100%" height="100%" fill="url(#admin-pattern)" />
 </svg>
</div>

 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
<div>
 <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-medium mb-4 backdrop-blur-sm">
<span className="material-icons-outlined text-sm">
campaign</span>
<span>
إعلان جديد</span>
</div>

 <h3 className="text-2xl md:text-3xl font-bold font-serif mb-2">
الخطب المنبرية الجديدة</h3>
<p className="text-gray-200 text-sm leading-relaxed max-w-lg mb-6">
 استمع إلى خطب الجمعة والأعياد والمناسبات الدينية. يمكنك الآن رفع خطبة الجمعة القادمة أو جدولة النشر. </p>
<div className="flex gap-3">
 <button className="bg-white text-primary hover:bg-gray-100 px-6 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
<span>
رفع خطبة جديدة</span>
<span className="material-icons-outlined text-sm rtl-flip">
arrow_back</span>
</button>

 <button className="bg-transparent border border-white/30 hover:bg-white/10 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
 عرض الأرشيف </button>
</div>

 </div>
<div className="hidden md:block opacity-80">
 <span className="material-icons-outlined text-[120px]">
podcasts</span>
</div>

 </div>
</div>

 ) }
