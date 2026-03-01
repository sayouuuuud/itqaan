import type { Metadata } from "next"
import { createPublicClient } from "@/lib/supabase/public"
import { ContactForm } from "./contact-form"

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "تواصل مع فريق موقع الشيخ السيد مراد - نسعد باستقبال استفساراتكم واقتراحاتكم",
}

// Default settings to use if database fetch fails
const defaultSettings = {
  important_notice:
    "هذا النموذج مخصص للتواصل العام والاقتراحات التقنية. لا يقدم الموقع فتاوى شرعية ولا يتم الرد على الأسئلة الفقهية عبر هذا النموذج.",
  email: "contact@alsayedmourad.com",
  facebook_url: "#",
  youtube_url: "#",
  telegram_url: "#",
  subject_options: ["استفسار عام", "طلب فتوى", "اقتراح", "شكوى", "أخرى"],
}

export default async function ContactPage() {
  // Fetch contact settings on the server for instant loading
  let contactSettings = defaultSettings

  try {
    const supabase = createPublicClient()
    const { data } = await supabase.from("contact_settings").select("*").limit(1)

    if (data?.[0]) {
      contactSettings = {
        important_notice: data[0].important_notice || defaultSettings.important_notice,
        email: data[0].email || defaultSettings.email,
        facebook_url: data[0].facebook_url || "#",
        youtube_url: data[0].youtube_url || "#",
        telegram_url: data[0].telegram_url || "#",
        subject_options: data[0].subject_options || defaultSettings.subject_options,
      }
    }
  } catch (error) {
    console.error("[CONTACT] Error fetching contact settings:", error)
  }

  return <ContactForm initialSettings={contactSettings} />
}
