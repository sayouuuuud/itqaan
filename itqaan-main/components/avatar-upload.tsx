"use client"

import { useState, useRef } from "react"
import { Camera, Loader2 } from "lucide-react"

interface AvatarUploadProps {
    currentUrl?: string | null
    name?: string
    size?: "sm" | "md" | "lg"
    onUploaded: (url: string) => void
}

export function AvatarUpload({ currentUrl, name, size = "md", onUploaded }: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(currentUrl || null)
    const inputRef = useRef<HTMLInputElement>(null)

    const sizeClasses = {
        sm: "w-12 h-12 text-sm",
        md: "w-20 h-20 text-xl",
        lg: "w-28 h-28 text-3xl",
    }

    const initials = name
        ? name
            .split(" ")
            .map((w) => w[0] || "")
            .slice(0, 2)
            .join("")
        : "؟"

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Show local preview immediately
        const localUrl = URL.createObjectURL(file)
        setPreview(localUrl)

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("image", file)
            formData.append("folder", "avatars")

            const res = await fetch("/api/upload", { method: "POST", body: formData })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || "Upload failed")

            const cloudUrl = data.url || data.imageUrl
            setPreview(cloudUrl)
            onUploaded(cloudUrl)
        } catch (err) {
            console.error("Avatar upload error:", err)
            setPreview(currentUrl || null) // revert on error
            alert("فشل رفع الصورة، حاول مرة أخرى")
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ""
        }
    }

    return (
        <div className="relative inline-block group cursor-pointer" onClick={() => !uploading && inputRef.current?.click()}>
            <div
                className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white shadow-md flex items-center justify-center bg-[#0B3D2E]/10 font-bold text-[#0B3D2E] select-none`}
            >
                {preview ? (
                    <img src={preview} alt={name || "avatar"} className="w-full h-full object-cover" />
                ) : (
                    <span>{initials}</span>
                )}
            </div>

            {/* Overlay */}
            <div className={`${sizeClasses[size]} absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                {uploading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                    <Camera className="w-5 h-5 text-white" />
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
            />
        </div>
    )
}
