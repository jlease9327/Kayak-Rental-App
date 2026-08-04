import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allows the temporary Cloudflare tunnel (and the LAN IP) to load dev
  // resources like the HMR websocket. Without this, Next.js silently blocks
  // cross-origin dev requests, which breaks client-side interactivity while
  // the page still appears to render.
  allowedDevOrigins: [
    "conclusions-contemporary-ladder-utilities.trycloudflare.com",
    "192.168.1.218",
  ],
};

export default nextConfig;
