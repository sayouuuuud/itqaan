import { createPublicClient } from "@/lib/supabase/public"

export default async function ProjectsPage() {
  const supabase = createPublicClient()
  const { data: projects } = await supabase
    .from("dawah_projects")
    .select("*")
    .eq("publish_status", "published")
    .order("created_at", { ascending: false }) 
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-secondary/5 to-background py-16">
<div className="max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            الدعوة
          </span>
<h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
            المشاريع الدعوية
          </h1>
<p className="text-text-muted max-w-2xl mx-auto">
            مشاريع دعوية وخيرية نسعى من خلالها لخدمة الإسلام والمسلمين
          </p>
</div>
      </section>

      {/* Content */}
      <section className="py-16">
<div className="max-w-7xl mx-auto px-4">
          {!projects || projects.length === 0 ? (
            <div className="text-center py-16">
<span className="material-icons-outlined text-6xl text-text-muted mb-4">
                volunteer_activism
              </span>
<h2 className="text-xl font-bold text-foreground mb-2">
                قريباً
              </h2>
<p className="text-text-muted">
                سيتم إضافة المشاريع الدعوية قريباً إن شاء الله
              </p>
</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow group"
                >
<div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="material-icons-outlined text-6xl text-primary/50 group-hover:scale-110 transition-transform">
                      volunteer_activism
                    </span>
</div>

                  <div className="p-6">
<h2 className="text-xl font-bold text-foreground mb-3">
                      {project.title}
                    </h2>
<p className="text-text-muted line-clamp-3">
                      {project.description}
                    </p>
</div>
                </article>
              ))}
            </div>
          )}
        </div>
</section>
    </div>
  )
}
