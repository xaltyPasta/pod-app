// src/lib/uploadMedia.ts
// Unsigned preset upload — no server secret needed.
// Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export async function uploadToCloudinary(file: File, folder?: string) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
    const defaultFolder = process.env.NEXT_PUBLIC_CLOUDINARY_DEFAULT_FOLDER || "pod-proof";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);
    formData.append("folder", folder || defaultFolder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();

    return {
        secureUrl: data.secure_url as string,
        publicId: data.public_id as string,
        resourceType: data.resource_type as "image" | "video" | string,
        bytes: data.bytes as number,
        format: data.format as string | undefined,
        width: data.width as number | undefined,
        height: data.height as number | undefined,
    };
}
