import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export interface StorageUploadResult {
    url: string;
    key: string;
    name: string;
    size: number;
}

/**
 * Uploads a file buffer to UploadThing.
 * Note: UTApi.uploadFiles expects a File object or an array of Files.
 */
export async function uploadToStorage(
    buffer: Buffer,
    filename: string,
    contentType: string
): Promise<StorageUploadResult> {
    // Correct way to handle Buffer in environments with File API
    const file = new File([buffer as any], filename, { type: contentType });
    const response = await utapi.uploadFiles(file);

    if (!response.data) {
        throw new Error(response.error?.message || "Upload failed");
    }

    return {
        url: (response.data as any).ufsUrl || response.data.url,
        key: response.data.key,
        name: response.data.name,
        size: response.data.size,
    };
}

/**
 * Deletes a file from UploadThing using its key.
 */
export async function deleteFromStorage(key: string): Promise<{ success: boolean }> {
    const response = await utapi.deleteFiles(key);
    return { success: response.success };
}

export default utapi;
