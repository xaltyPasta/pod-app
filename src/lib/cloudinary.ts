// src/lib/cloudinary.ts
export async function uploadBlobToCloudinary(blob: Blob, filename: string) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
    const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", preset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: form,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || "Cloudinary upload failed");
    return json as { secure_url: string; resource_type: string };
}
