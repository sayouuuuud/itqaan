import Link from "next/link"

export function NewsletterCard() {
    return (
        <div className="bg-primary text-white rounded-xl p-6 relative overflow-hidden">
            <span className="material-icons-outlined absolute -bottom-8 -left-8 text-9xl text-white opacity-10">mail_outline</span>
            <h3 className="font-bold text-lg mb-2 relative z-10">اشترك في القائمة البريدية</h3>
            <p className="text-primary-100 text-sm mb-4 relative z-10 opacity-90">
                احصل على أحدث الخطب والمقالات والدروس مباشرة إلى بريدك الإلكتروني.
            </p>
            <div className="relative z-10">
                <Link href="/subscribe">
                    <button className="w-full bg-secondary hover:bg-yellow-600 text-white font-bold py-2 rounded-lg transition-colors">
                        اشتراك الآن
                    </button>
                </Link>
            </div>
        </div>
    )
}
