// src/app/capture/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadBlobToCloudinary } from "@/lib/cloudinary";

type Mode = "PHOTO" | "VIDEO";

export default function CaptureProofPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const awb = (sp.get("awb") || "").trim();

    const [mode, setMode] = useState<Mode>("PHOTO");
    const [info, setInfo] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    // 🔐 Explicit camera state machine
    const [cameraOn, setCameraOn] = useState(true);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const hasPreview = !!previewUrl;

    // Validate AWB
    useEffect(() => {
        if (!awb) setError("Missing AWB. Go back and scan/enter AWB.");
    }, [awb]);

    // Start/stop the camera based on cameraOn + mode (constant deps)
    useEffect(() => {
        let cancelled = false;

        async function boot() {
            if (!cameraOn) {
                stopCamera(false);
                return;
            }
            setError("");
            setInfo("Opening camera…");
            try {
                await startCamera(mode);
                if (!cancelled) setInfo("Camera ready.");
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message || "Failed to open camera");
                    setInfo("");
                    setCameraOn(false);
                }
            }
        }

        boot();
        return () => {
            cancelled = true;
            // Always stop hardware on cleanup
            stopCamera(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cameraOn, mode]);

    async function startCamera(currentMode: Mode) {
        // Full reset
        stopCamera(false);

        const devices = await navigator.mediaDevices.enumerateDevices();
        const vids = devices.filter((d) => d.kind === "videoinput");
        const back =
            vids.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
            vids[1]?.deviceId ||
            vids[0]?.deviceId;

        const constraints: MediaStreamConstraints = {
            video: back ? { deviceId: { exact: back } } : { facingMode: { ideal: "environment" } },
            audio: currentMode === "VIDEO",
        };

        const s = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = s;

        const v = videoRef.current;
        if (!v) throw new Error("Video element not ready");
        // Important: reset srcObject before assigning
        v.srcObject = null;
        // Next tick to ensure detach
        await new Promise((r) => requestAnimationFrame(r));
        v.srcObject = s;
        v.muted = true;
        v.playsInline = true;
        await v.play();
    }

    function stopCamera(releasePreview: boolean) {
        // Stop recording if running
        if (recRef.current) {
            try {
                if (recRef.current.state !== "inactive") recRef.current.stop();
            } catch { }
            recRef.current = null;
        }
        setIsRecording(false);

        // Stop all tracks
        if (streamRef.current) {
            for (const track of streamRef.current.getTracks()) {
                try {
                    track.stop();
                    // @ts-ignore
                    track.enabled = false;
                } catch { }
            }
            streamRef.current = null;
        }

        // Detach from element
        const v = videoRef.current;
        if (v) {
            try {
                v.pause();
            } catch { }
            v.srcObject = null;
            // Force GC path
            // @ts-ignore
            v.src = "";
            v.load?.();
        }

        // Only revoke preview when we explicitly retake
        if (releasePreview && previewUrl) {
            try {
                URL.revokeObjectURL(previewUrl);
            } catch { }
            setPreviewUrl(null);
        }
    }

    async function retake() {
        setCapturedBlob(null);
        if (previewUrl) {
            try {
                URL.revokeObjectURL(previewUrl);
            } catch { }
            setPreviewUrl(null);
        }
        setBusy(false);
        setInfo("");
        setError("");
        // Explicitly turn camera back on
        setCameraOn(true);
    }

    /** PHOTO */
    async function takePhoto() {
        const v = videoRef.current;
        if (!v) return;

        const canvas = document.createElement("canvas");
        // Default to a reasonable size if metadata not ready
        canvas.width = v.videoWidth || 1280;
        canvas.height = v.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, "image/jpeg", 0.92)
        );
        if (!blob) {
            setError("Failed to capture photo");
            return;
        }

        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));

        // 🔒 Hard stop the camera and keep it OFF
        setCameraOn(false);
        stopCamera(false);
        setInfo("Photo captured.");
    }

    /** VIDEO */
    function startRecording() {
        const s = streamRef.current;
        if (!s || isRecording) return;
        chunksRef.current = [];
        try {
            const rec = new MediaRecorder(s, { mimeType: "video/webm;codecs=vp8" });
            recRef.current = rec;

            rec.ondataavailable = (e) => {
                if (e.data?.size) chunksRef.current.push(e.data);
            };

            rec.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "video/webm" });
                setCapturedBlob(blob);
                setPreviewUrl(URL.createObjectURL(blob));

                // 🔒 Keep camera OFF after capture
                setCameraOn(false);
                stopCamera(false);
                setInfo("Video captured.");
            };

            rec.start();
            setIsRecording(true);
            setInfo("Recording…");
        } catch (e: any) {
            setError(e?.message || "Recording not supported");
        }
    }

    function stopRecording() {
        if (!recRef.current) return;
        try {
            recRef.current.stop();
        } catch { }
    }

    /** Upload & Save */
    async function uploadAndSave() {
        if (!awb) {
            setError("AWB missing.");
            return;
        }
        if (!capturedBlob) {
            setError("Capture a photo or video first.");
            return;
        }

        setBusy(true);
        setError("");
        setInfo("Uploading…");

        try {
            const filenameBase = `pod_${awb}_${Date.now()}`;
            const upl = await uploadBlobToCloudinary(
                capturedBlob,
                filenameBase + (capturedBlob.type.startsWith("image/") ? ".jpg" : ".webm")
            );
            const mediaType = upl.resource_type === "video" ? "VIDEO" : "IMAGE";

            const res = await fetch("/api/deliveries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ awb, mediaUrl: upl.secure_url, mediaType }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error || "Failed to save delivery");

            setInfo("✅ Saved successfully! Redirecting…");
            setTimeout(() => router.push("/success"), 2000);
        } catch (e: any) {
            setError(e?.message || "Upload/Save failed");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="container py-4">
            <h3 className="mb-2 text-center">AWB: {awb || "—"}</h3>
            <h4 className="text-center text-secondary mb-4 mt-4">Please Upload Proof of Delivery </h4>

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

            {/* Mode toggle */}
            <div className="d-flex justify-content-center mb-3">
                <div className="btn-group" role="group" aria-label="mode">
                    <button
                        className={`btn btn-${mode === "PHOTO" ? "primary" : "outline-primary"}`}
                        onClick={() => setMode("PHOTO")}
                        disabled={busy || isRecording || !cameraOn || hasPreview}
                        title={hasPreview ? "Retake to switch mode" : undefined}
                    >
                        Photo
                    </button>
                    <button
                        className={`btn btn-${mode === "VIDEO" ? "primary" : "outline-primary"}`}
                        onClick={() => setMode("VIDEO")}
                        disabled={busy || isRecording || !cameraOn || hasPreview}
                        title={hasPreview ? "Retake to switch mode" : undefined}
                    >
                        Video
                    </button>
                </div>
            </div>


            {/* Live or Captured Preview */}
            {!hasPreview ? (
                <div className="ratio ratio-16x9 mb-3">
                    <video
                        ref={videoRef}
                        className="w-100 rounded shadow-sm"
                        playsInline
                        autoPlay
                        muted
                    />
                </div>
            ) : (
                <div className="ratio ratio-16x9 mb-3">
                    {mode === "PHOTO" ? (
                        <img
                            src={previewUrl!}
                            alt="Captured"
                            className="w-100 h-100 object-fit-cover rounded shadow-sm"
                        />
                    ) : (
                        <video
                            key={previewUrl!}
                            src={previewUrl!}
                            className="w-100 h-100 rounded shadow-sm"
                            controls
                            autoPlay
                            muted
                            playsInline
                            preload="metadata"
                            onLoadedMetadata={(e) => {
                                const el = e.currentTarget;
                                el.play().catch(() => { });
                            }}
                            onError={() => setError("Unable to play captured video preview")}
                        />
                    )}
                </div>
            )}

            {/* Controls */}
            {!hasPreview && (
                <div className="d-flex justify-content-center gap-2 mt-3">
                    {mode === "PHOTO" ? (
                        <button
                            className="btn btn-primary"
                            onClick={takePhoto}
                            disabled={busy || !cameraOn}
                        >
                            Take Photo
                        </button>
                    ) : (
                        <>
                            {!isRecording && (
                                <button
                                    className="btn btn-primary"
                                    onClick={startRecording}
                                    disabled={busy || !cameraOn}
                                >
                                    Start Recording
                                </button>
                            )}
                            {isRecording && (
                                <button
                                    className="btn btn-danger"
                                    onClick={stopRecording}
                                    disabled={busy}
                                >
                                    Stop Recording
                                </button>
                            )}
                        </>
                    )}
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => router.push("/scan")}
                        disabled={isRecording}
                    >
                        Back
                    </button>
                </div>
            )}

            {hasPreview && (
                <div className="d-flex justify-content-center gap-2 mt-3">
                    <button className="btn btn-secondary" onClick={retake} disabled={busy}>
                        Retake
                    </button>
                    <button className="btn btn-success" onClick={uploadAndSave} disabled={busy}>
                        {busy ? "Saving…" : "Upload & Save"}
                    </button>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => router.push("/scan")}
                        disabled={busy}
                    >
                        Back
                    </button>
                </div>
            )}


        </div>
    );
}
