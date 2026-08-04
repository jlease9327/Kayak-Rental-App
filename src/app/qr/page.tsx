"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";

function noopSubscribe() {
  return () => {};
}

function useOrigin() {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => ""
  );
}

export default function QrPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [customUrl, setCustomUrl] = useState("");
  const origin = useOrigin();

  const url = customUrl || (origin ? `${origin}/book` : "");

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 320,
        margin: 2,
        color: { dark: "#0c4a6e", light: "#ffffff" },
      }).catch(() => {});
    }
  }, [url]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "paddle-point-booking-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-zinc-900">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Booking QR Code
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Print this and post it at your launch sites, van, or storefront.
        </p>

        <div className="mt-5 flex justify-center">
          <canvas ref={canvasRef} className="rounded-lg" />
        </div>

        <label className="mt-5 block text-left text-xs font-medium text-zinc-500">
          Points to
        </label>
        <input
          value={url}
          onChange={(e) => setCustomUrl(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-center text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <p className="mt-1 text-[11px] text-zinc-400">
          Once this app is deployed to a real domain, update this to that
          domain&apos;s /book URL so the printed code always works.
        </p>

        <button
          onClick={download}
          className="mt-5 w-full rounded-full bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}
