"use client"

import Link from "next/link"
import { createPublicClient } from "@/lib/supabase/public"
import { useEffect, useState } from "react"

export function SheikhProfileCard() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const supabase = createPublicClient()

                // Fetch only about_page data as it's the source of truth for the About section
                const { data, error } = await supabase
                    .from("about_page")
                    .select("sheikh_name, position, sheikh_photo, image_path")
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single()

                if (error) {
                    console.error("Error fetching profile:", error)
                    return
                }

                if (data) {
                    // Prioritize image_path as used in the main About page
                    const profileData = {
                        ...data,
                        final_image: data.image_path || data.sheikh_photo
                    }
                    setProfile(profileData)
                }
            } catch (error) {
                console.error("Error fetching profile:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [])

    const name = profile?.sheikh_name || "الشيخ السيد مراد"
    const position = profile?.position || "إمام وخطيب ومدرس بالأوقاف المصرية"

    // Default placeholder
    let imageSrc = null

    // Determine image source
    const dbImage = profile?.final_image

    if (dbImage) {
        if (dbImage.startsWith("http") || dbImage.startsWith("https")) {
            imageSrc = dbImage
        } else if (dbImage.startsWith("/")) {
            imageSrc = dbImage
        } else {
            // Assume it's a storage key (e.g. uploads/..., images/...)
            imageSrc = `/api/download?key=${encodeURIComponent(dbImage)}`
        }
    }


    return (
        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 dark:bg-gray-700 mb-4 overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                <img
                    alt={name}
                    className="w-full h-full object-cover"
                    src={imageSrc}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/islamic-scholar-portrait.jpg";
                    }}
                />
            </div>
            <h3 className="text-xl font-bold text-card-foreground mb-1">{name}</h3>
            <p className="text-secondary text-sm mb-4">{position}</p>
            <Link href="/about">
                <button className="w-full bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-border">
                    عرض الملف الشخصي
                </button>
            </Link>
        </div>
    )
}
