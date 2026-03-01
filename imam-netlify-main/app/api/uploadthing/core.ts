import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

/**
 * UploadThing File Router
 * يُستخدم لرفع الصور فقط (مع تحسين تلقائي على جانب العميل)
 */
export const ourFileRouter = {
    // رافع الصور العام
    imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async () => {
            // يمكن إضافة التحقق من المستخدم هنا
            return {}
        })
        .onUploadComplete(async ({ file }) => {
            console.log("✅ UploadThing: Image uploaded:", file.ufsUrl)
            return { url: file.ufsUrl }
        }),

    // رافع صور الأغلفة
    coverImageUploader: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
        .middleware(async () => {
            return {}
        })
        .onUploadComplete(async ({ file }) => {
            console.log("✅ UploadThing: Cover image uploaded:", file.ufsUrl)
            return { url: file.ufsUrl }
        }),

    // رافع صور المقالات
    articleImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
        .middleware(async () => {
            return {}
        })
        .onUploadComplete(async ({ file }) => {
            console.log("✅ UploadThing: Article image uploaded:", file.ufsUrl)
            return { url: file.ufsUrl }
        }),

    // رافع الشعار والأيقونات
    logoUploader: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } })
        .middleware(async () => {
            return {}
        })
        .onUploadComplete(async ({ file }) => {
            console.log("✅ UploadThing: Logo uploaded:", file.ufsUrl)
            return { url: file.ufsUrl }
        }),

    // رافع ملفات PDF (للكتب) - حجم كبير لدعم الكتب المجمعة
    pdfUploader: f({ pdf: { maxFileSize: "128MB", maxFileCount: 1 } })
        .middleware(async () => {
            return {}
        })
        .onUploadComplete(async ({ file }) => {
            console.log("✅ UploadThing: PDF uploaded:", file.ufsUrl)
            return { url: file.ufsUrl }
        }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
