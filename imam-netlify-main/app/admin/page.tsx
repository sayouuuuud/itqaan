import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ViewsChart } from "@/components/admin/views-chart";
import { TopContent } from "@/components/admin/analytics/top-content";
import { VisitorStats } from "@/components/admin/analytics/visitors-stats";
import {
  PlusCircle,
  Mic,
  GraduationCap,
  FileText,
  BookOpen,
  Users,
  Video,
  Settings,
  User,
  Eye,
  TrendingUp,
  Calendar,
  ChevronLeft,
} from "lucide-react";

const quickActions = [
  { label: "إضافة خطبة", href: "/admin/khutba", icon: PlusCircle },
  { label: "إضافة درس", href: "/admin/dars", icon: PlusCircle },
  { label: "إضافة مقال", href: "/admin/articles", icon: PlusCircle },
  { label: "إضافة كتاب", href: "/admin/books", icon: PlusCircle },
];

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Server-side guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch real stats from database
  // Fetch real stats from database
  const [
    { count: sermonsCount },
    { count: lessonsCount },
    { count: articlesCount },
    { count: booksCount },
    { count: subscribersCount },
    { count: videosCount },
    // Fetch top viewed content from each table
    { data: topSermons },
    { data: topLessons },
    { data: topArticles },
    // Fetch analytics data
    { data: analyticsData },
    // New Analytics Queries
    { data: topPagesData },
    { data: countryStats },
    { data: deviceStats },
    { data: booksDownloadsData },
    { data: lessonsDownloadsData },
    { data: sermonsDownloadsData },
  ] = await Promise.all([
    supabase.from("sermons").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
    supabase.from("media").select("*", { count: "exact", head: true }),
    // Top content queries
    supabase
      .from("sermons")
      .select("id, title, views_count")
      .order("views_count", { ascending: false })
      .limit(10),
    supabase
      .from("lessons")
      .select("id, title, views_count")
      .order("views_count", { ascending: false })
      .limit(10),
    supabase
      .from("articles")
      .select("id, title, views")
      .order("views", { ascending: false })
      .limit(10),
    // Correct analytics view - Last 30 days
    supabase
      .from("analytics_daily_stats")
      .select("*")
      .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("date", { ascending: true }),
    // New Analytics Queries
    supabase.from("analytics_top_pages").select("*").limit(10),
    supabase.from("analytics_country_stats").select("*").limit(10),
    supabase.from("analytics_device_stats").select("*"),
    // Fetch download counts
    supabase.from("books").select("download_count"),
    supabase.from("lessons").select("download_count"),
    supabase.from("sermons").select("download_count"),
  ]);

  // Aggregate and sort top content with details
  const topContentCombined = await Promise.all((topPagesData || []).map(async (item: any) => {
    let title = item.page_path;
    let type = 'page';
    let publishedAt = null;

    // Clean path and split
    const cleanPath = item.page_path.replace(/^\/|\/$/g, '');
    const pathParts = cleanPath.split('/');
    const mainSection = pathParts[0];
    const id = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

    // Handle Index Pages
    if (pathParts.length === 1) {
      if (mainSection === "khutba") { title = "الخطب"; type = "page"; }
      else if (mainSection === "dars") { title = "الدروس"; type = "page"; }
      else if (mainSection === "books") { title = "الكتب"; type = "page"; }
      else if (mainSection === "articles") { title = "المقالات"; type = "page"; }
      else if (mainSection === "about") { title = "عن الشيخ"; type = "page"; }
      else if (mainSection === "contact") { title = "تواصل معنا"; type = "page"; }
    }
    // Handle Content Pages
    else if (id) {
      // Use a helper function or direct query
      const getTitleDate = async (table: string) => {
        const { data } = await supabase.from(table).select("title, created_at").eq("id", id).single();
        return data ? { title: data.title, date: data.created_at } : null;
      };
      const getTitleDateSermons = async (table: string) => {
        const { data } = await supabase.from(table).select("title, date").eq("id", id).single();
        return data ? { title: data.title, date: data.date } : null;
      };

      if (mainSection === "khutba") {
        type = 'khutba';
        const info = await getTitleDateSermons("sermons");
        if (info) { title = info.title; publishedAt = info.date; }
      } else if (mainSection === "dars") {
        type = 'dars';
        const info = await getTitleDateSermons("lessons");
        if (info) { title = info.title; publishedAt = info.date; }
      } else if (mainSection === "books") {
        type = 'book';
        // Note: Books usually use created_at, but let's check if there's a specific date field if needed. 
        // Using created_at as per previous code.
        const info = await getTitleDate("books");
        if (info) { title = info.title; publishedAt = info.date; }
      } else if (mainSection === "articles") {
        type = 'article';
        const info = await getTitleDate("articles");
        if (info) { title = info.title; publishedAt = info.date; }
      }
    }

    if (item.page_path === "/" || item.page_path === "") {
      title = "الرئيسية";
      type = "page";
    }

    return {
      page_path: item.page_path,
      title: title,
      views: item.views,
      type: type,
      publishedAt: publishedAt
    };
  }));

  // Calculate total views
  const totalViews = (analyticsData || []).reduce((sum, day) => sum + (day.views_count || 0), 0);

  // Calculate download stats
  const bookDownloads = (booksDownloadsData || []).reduce((sum: number, item: any) => sum + (item.download_count || 0), 0);
  const lessonDownloads = (lessonsDownloadsData || []).reduce((sum: number, item: any) => sum + (item.download_count || 0), 0);
  const sermonDownloads = (sermonsDownloadsData || []).reduce((sum: number, item: any) => sum + (item.download_count || 0), 0);

  const audioDownloads = lessonDownloads + sermonDownloads;
  const totalDownloads = bookDownloads + audioDownloads;

  const stats = [
    {
      label: "الخطب",
      value: sermonsCount?.toString() || "0",
      icon: Mic,
      color: "bg-blue-500",
      href: "/admin/khutba",
    },
    {
      label: "الدروس",
      value: lessonsCount?.toString() || "0",
      icon: GraduationCap,
      color: "bg-green-500",
      href: "/admin/dars",
    },
    {
      label: "المقالات",
      value: articlesCount?.toString() || "0",
      icon: FileText,
      color: "bg-amber-500",
      href: "/admin/articles",
    },
    {
      label: "الكتب",
      value: booksCount?.toString() || "0",
      icon: BookOpen,
      color: "bg-purple-500",
      href: "/admin/books",
    },
    {
      label: "المرئيات",
      value: videosCount?.toString() || "0",
      icon: Video,
      color: "bg-red-500",
      href: "/admin/videos",
    },
    {
      label: "المشتركين",
      value: subscribersCount?.toString() || "0",
      icon: Users,
      color: "bg-teal-500",
      href: "/admin/subscribers",
    },
  ];

  const quickLinks = [
    { label: "إدارة الكتب", href: "/admin/books", icon: BookOpen },
    { label: "إدارة المرئيات", href: "/admin/videos", icon: Video },
    { label: "الجدول الزمني", href: "/admin/schedule", icon: Calendar },
    { label: "إعدادات الموقع", href: "/admin/settings", icon: Settings },
    { label: "الأمان والملف الشخصي", href: "/admin/security", icon: User },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Welcome Section */}
      <div className="bg-gradient-to-l from-primary to-primary-hover rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">مرحباً بك في لوحة التحكم</h2>
          <p className="text-green-100 text-sm mb-4">إدارة محتوى موقع الشيخ السيد مراد بكل سهولة</p>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors"
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {totalViews.toLocaleString("ar-EG")}
            </p>
            <p className="text-xs sm:text-sm text-text-muted">زيارة (30 يوم)</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {totalDownloads.toLocaleString("ar-EG")}
            </p>
            <p className="text-xs sm:text-sm text-text-muted">إجمالي التحميلات</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {bookDownloads.toLocaleString("ar-EG")}
            </p>
            <p className="text-xs sm:text-sm text-text-muted">تحميلات الكتب</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
            <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {audioDownloads.toLocaleString("ar-EG")}
            </p>
            <p className="text-xs sm:text-sm text-text-muted">تحميلات الملفات الصوتيه</p>
          </div>
        </div>

      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-surface rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
              <p className="text-sm text-text-muted">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Views Chart */}
      <ViewsChart data={analyticsData || []} />

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitor Stats (Countries & Devices) */}
        <div className="lg:col-span-3">
          <VisitorStats
            countryData={countryStats || []}
            deviceData={deviceStats || []}
          />
        </div>

        {/* Top Content Table */}
        <div className="lg:col-span-3">
          <TopContent initialData={topContentCombined || []} />
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-surface rounded-xl border border-border p-6 mt-6">
        <h3 className="font-bold text-foreground mb-4">روابط سريعة</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted text-text-muted hover:text-foreground transition-colors"
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}

