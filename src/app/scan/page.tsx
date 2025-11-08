// src/app/scan/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";

function explainGUMError(err: any) {
    const name = err?.name || "";
    const msg = err?.message || "";
    switch (name) {
        case "NotAllowedError":
        case "SecurityError":
            return "Camera permission blocked. Allow camera in site settings, then reload.";
        case "NotFoundError":
            return "No camera device found.";
        case "NotReadableError":
        case "TrackStartError":
            return "Camera is in use by another app/tab. Close them and retry.";
        case "OverconstrainedError":
            return `No camera matches requested constraints. ${msg || ""}`;
        default:
            return `Camera access failed: ${name || "UnknownError"} ${msg ? `- ${msg}` : ""}`;
    }
}

export default function ScanPage() {
    const router = useRouter();
    const [manualAwb, setManualAwb] = useState("");
    const [isCapturing, setIsCapturing] = useState(false);
    const [info, setInfo] = useState("");
    const [error, setError] = useState("");

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const scanningRef = useRef(false);

    useEffect(() => () => stopCamera(), []);

    async function startCamera() {
        setError("");
        setInfo("Requesting camera permission…");
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
            setError("This browser does not support getUserMedia.");
            return;
        }
        try {
            setIsCapturing(true);
            await Promise.resolve();

            const devices = await navigator.mediaDevices.enumerateDevices();
            const vids = devices.filter((d) => d.kind === "videoinput");
            const back =
                vids.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
                vids[1]?.deviceId ||
                vids[0]?.deviceId;

            const constraints: MediaStreamConstraints = {
                video: back ? { deviceId: { exact: back } } : { facingMode: { ideal: "environment" } },
                audio: false,
            };

            const s = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = s;

            const v = videoRef.current;
            if (!v) throw new Error("Video element not ready");
            v.srcObject = s;
            await v.play();

            setInfo("Scanning… align AWB QR/barcode in the frame.");
            scanningRef.current = true;
            loop();
        } catch (e) {
            setError(explainGUMError(e));
            setIsCapturing(false);
            cleanupStream();
        }
    }

    function stopCamera() {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        scanningRef.current = false;
        cleanupStream();
        const v = videoRef.current;
        if (v) {
            try { v.pause(); } catch { }
            v.srcObject = null;
        }
        setIsCapturing(false);
        setInfo("");
    }

    function cleanupStream() {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }

    function loop() {
        if (!scanningRef.current) return;
        const v = videoRef.current;
        const c = canvasRef.current;
        if (v && c && v.readyState === v.HAVE_ENOUGH_DATA) {
            c.width = v.videoWidth || 640;
            c.height = v.videoHeight || 480;
            const ctx = c.getContext("2d");
            if (ctx) {
                ctx.drawImage(v, 0, 0, c.width, c.height);
                const img = ctx.getImageData(0, 0, c.width, c.height);
                const code = jsQR(img.data, img.width, img.height);
                if (code?.data) {
                    stopCamera();

                    // ✅ Keep only substring up to first whitespace OR first "|" (pipe)
                    const raw = code.data.trim();
                    const awb = raw.split(/[|\s]+/)[0];

                    router.push(`/capture?awb=${encodeURIComponent(awb)}`);
                    return;
                }
            }
        }
        rafRef.current = requestAnimationFrame(loop);
    }

    function proceedManual() {
        // Apply the same cropping rule for manual input
        const awb = manualAwb.trim().split(/[|\s]+/)[0];
        if (!awb) return setError("Enter AWB to proceed.");
        router.push(`/capture?awb=${encodeURIComponent(awb)}`);
    }

    return (
        <div className="container py-4">
            <h3 className="mb-3 text-center">Scan AWB</h3>

            <h4 className="text-center text-secondary mb-2 mt-4">
                Scan the code or enter the AWB manually, then proceed to capture proof.
            </h4>

            {/* Manual AWB entry */}
            <div className="d-flex justify-content-center mb-3">
                <div className="d-flex gap-2 w-75">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter AWB No here"
                        value={manualAwb}
                        onChange={(e) => setManualAwb(e.target.value)}
                    />
                    <button className="btn btn-secondary" onClick={proceedManual}>
                        Proceed
                    </button>
                </div>
            </div>

            {info && (
                <div className="d-flex justify-content-center">
                    <div className="alert alert-info py-2 w-75 text-center">{info}</div>
                </div>
            )}

            {error && (
                <div className="d-flex justify-content-center">
                    <div className="alert alert-danger py-2 w-75 text-center">{error}</div>
                </div>
            )}

            {/* Centered Camera Controls */}
            <div className="d-flex justify-content-center gap-2 mb-3">
                {!isCapturing ? (
                    <button className="btn btn-primary" onClick={startCamera}>
                        Open Camera
                    </button>
                ) : (
                    <button className="btn btn-danger" onClick={stopCamera}>
                        Stop
                    </button>
                )}
            </div>

            {/* Centered Video Preview */}
            <div className={`d-flex justify-content-center mb-2 ${isCapturing ? "" : "d-none"}`}>
                <div className="ratio ratio-16x9 w-75">
                    <video
                        ref={videoRef}
                        className="w-100 rounded shadow-sm"
                        playsInline
                        autoPlay
                        muted
                    />
                </div>
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
    );
}
