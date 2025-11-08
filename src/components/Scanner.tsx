// src/components/Scanner.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

interface ScannerProps {
    onDetected: (awb: string) => void;
}

export default function Scanner({ onDetected }: ScannerProps) {
    const [error, setError] = useState("");
    const [active, setActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        const video = videoRef.current!;
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d");

        async function startScanner() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                });
                video.srcObject = stream;
                await video.play();
                setActive(true);
                requestAnimationFrame(scanFrame);
            } catch (e) {
                setError("Camera access denied or unavailable.");
            }
        }

        function scanFrame() {
            if (!active) return;
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                context?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imgData = context?.getImageData(0, 0, canvas.width, canvas.height);
                if (imgData) {
                    const code = jsQR(imgData.data, imgData.width, imgData.height);
                    if (code?.data) {
                        stopScanner();
                        onDetected(code.data);
                    }
                }
            }
            requestAnimationFrame(scanFrame);
        }

        function stopScanner() {
            stream?.getTracks().forEach((t) => t.stop());
            setActive(false);
        }

        startScanner();
        return () => stopScanner();
    }, []);

    return (
        <div className="scanner-component text-center">
            {error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <>
                    <video ref={videoRef} className="w-100 rounded shadow-sm mb-2" />
                    <canvas ref={canvasRef} hidden />
                    <p className="text-muted small">
                        Align the barcode/QR code within the frame to detect automatically.
                    </p>
                </>
            )}
        </div>
    );
}
