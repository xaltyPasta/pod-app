// src/components/CaptureWidget.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface CaptureWidgetProps {
    onCapture: (file: File) => void;
}

export default function CaptureWidget({ onCapture }: CaptureWidgetProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (e) {
                alert("Camera permission denied or unavailable.");
            }
        }
        startCamera();
    }, []);

    function handleCapture() {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                setPreview(URL.createObjectURL(file));
                onCapture(file);
            }
        }, "image/jpeg");
    }

    return (
        <div className="text-center">
            {!preview ? (
                <>
                    <video ref={videoRef} autoPlay playsInline className="w-100 rounded shadow-sm mb-3" />
                    <button className="btn btn-primary" onClick={handleCapture}>
                        Capture Photo
                    </button>
                </>
            ) : (
                <>
                    <img src={preview} className="w-100 rounded shadow-sm mb-3" alt="Preview" />
                    <button className="btn btn-secondary" onClick={() => setPreview(null)}>
                        Retake
                    </button>
                </>
            )}
        </div>
    );
}
