import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// The PWA plugin generates the service worker + injects the manifest link.
// This is what lets someone "Add to Home Screen" on a phone and get an app
// icon, a splash screen, and offline loading of the app shell — with the
// exact same code that runs the website.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "Waypoint — Goal Planner",
        short_name: "Waypoint",
        description: "Plan long-term goals broken into milestones and daily tasks.",
        start_url: "/",
        display: "standalone",
        background_color: "#F1F4EE",
        theme_color: "#1F3D2E",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
