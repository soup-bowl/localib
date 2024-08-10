/// <reference types="vitest" />

import legacy from "@vitejs/plugin-legacy"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		legacy(),
		VitePWA({
			registerType: "autoUpdate",
			devOptions: {
				enabled: false,
			},
			workbox: {
				cleanupOutdatedCaches: true,
			},
			manifest: {
				short_name: "Offline Collection",
				name: "Offline Collection",
				icons: [
					{
						src: "favicon.ico",
						sizes: "64x64",
						type: "image/png",
					},
					{
						src: "logo-mask-192.png",
						type: "image/png",
						sizes: "192x192",
						purpose: "maskable",
					},
					{
						src: "logo-mask-512.png",
						type: "image/png",
						sizes: "512x512",
						purpose: "maskable",
					},
				],
				start_url: ".",
				display: "standalone",
				theme_color: "#0d0d0d",
				background_color: "#0d0d0d",
			},
		}),
	],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/setupTests.ts",
	},
})
