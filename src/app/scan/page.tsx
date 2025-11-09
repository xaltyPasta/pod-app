// src/app/scan/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

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

// Extend capabilities shape safely
type AnyTrackCapabilities = MediaTrackCapabilities & {
    focusMode?: string[];
    torch?: boolean;
};

// Split at first whitespace, "/", "-", "\" or "|"
function normalizeAwb(raw: string) {
    return raw.trim().split(/[|\s\/\\-]+/)[0];
}

export default function ScanPage() {
    const router = useRouter();
    const [manualAwb, setManualAwb] = useState("");
    const [isCapturing, setIsCapturing] = useState(false);
    const [info, setInfo] = useState("");
    const [error, setError] = useState("");

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const zxingControlsRef = useRef<IScannerControls | null>(null);

    // Prevent background scroll when full-screen overlay is open
    useEffect(() => {
        if (isCapturing) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev;
            };
        }
    }, [isCapturing]);

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

            const devices = await navigator.mediaDevices.enumerateDevices();
            const vids = devices.filter((d) => d.kind === "videoinput");
            const backId =
                vids.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
                vids[1]?.deviceId ||
                vids[0]?.deviceId;

            const constraints: MediaStreamConstraints = {
                video: backId ? { deviceId: { exact: backId } } : { facingMode: { ideal: "environment" } },
                audio: false,
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            const v = videoRef.current;
            if (!v) throw new Error("Video element not ready");
            v.srcObject = stream;
            await v.play();

            // Try enabling continuous autofocus / leave torch off if supported
            const track = stream.getVideoTracks()[0];
            const caps = (track.getCapabilities?.() ?? {}) as AnyTrackCapabilities;
            const advanced: Record<string, unknown>[] = [];
            if (Array.isArray(caps.focusMode) && caps.focusMode.includes("continuous")) {
                advanced.push({ focusMode: "continuous" });
            }
            if (caps.torch) {
                advanced.push({ torch: false });
            }
            if (advanced.length) {
                await track.applyConstraints({ advanced } as MediaTrackConstraints).catch(() => { });
            }

            setInfo("Scanning… align the QR/barcode in the frame.");

            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [
                BarcodeFormat.QR_CODE,
                BarcodeFormat.CODE_128,
                BarcodeFormat.CODE_39,
                BarcodeFormat.EAN_13,
                BarcodeFormat.EAN_8,
                BarcodeFormat.UPC_A,
                BarcodeFormat.UPC_E,
                BarcodeFormat.ITF,
                BarcodeFormat.PDF_417,
                BarcodeFormat.AZTEC,
                BarcodeFormat.DATA_MATRIX,
            ]);

            const reader = new BrowserMultiFormatReader(hints, {
                delayBetweenScanAttempts: 300,
            });
            zxingReaderRef.current = reader;

            // Await the controls (scanner instance)
            const controls = await reader.decodeFromVideoElement(videoRef.current!, (result) => {
                if (result) {
                    const awb = normalizeAwb(result.getText());
                    stopCamera();
                    router.push(`/capture?awb=${encodeURIComponent(awb)}`);
                }
            });
            zxingControlsRef.current = controls;
        } catch (e) {
            setError(explainGUMError(e));
            setIsCapturing(false);
            cleanupStream();
        }
    }

    function stopCamera() {
        try {
            zxingControlsRef.current?.stop(); // Properly stops ZXing scanning
        } catch { }
        zxingControlsRef.current = null;
        zxingReaderRef.current = null;

        cleanupStream();

        const v = videoRef.current;
        if (v) {
            try {
                v.pause();
            } catch { }
            v.srcObject = null;
        }

        setIsCapturing(false);
        setInfo("");
    }

    function cleanupStream() {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }

    function proceedManual() {
        const awb = normalizeAwb(manualAwb);
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

            {/* Camera Controls (only when not capturing) */}
            {!isCapturing && (
                <div className="d-flex justify-content-center gap-2 mb-3">
                    <button className="btn btn-primary" onClick={startCamera}>
                        Open Camera
                    </button>
                </div>
            )}

            {/* Full-screen mobile-friendly preview overlay */}
            {isCapturing && (
                <div
                    className="position-fixed"
                    style={{
                        inset: 0,
                        zIndex: 1050,
                        background: "#000",
                    }}
                >
                    <video
                        ref={videoRef}
                        playsInline
                        autoPlay
                        muted
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100dvh",
                            objectFit: "cover",
                        }}
                        className="rounded-0"
                    />

                    {/* Bottom safe-area Stop button */}
                    <div
                        className="position-absolute start-0 end-0 d-flex justify-content-center"
                        style={{
                            bottom: "calc(env(safe-area-inset-bottom) + 16px)",
                            paddingLeft: "env(safe-area-inset-left)",
                            paddingRight: "env(safe-area-inset-right)",
                        }}
                    >
                        <button className="btn btn-danger px-4 py-2" onClick={stopCamera}>
                            Stop
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
