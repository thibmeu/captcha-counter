import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";

export default defineConfig(({ mode }) => ({
  build: {
    outDir: `dist/${mode}`,
    emptyOutDir: true,
  },
  plugins: [
    webExtension({
      manifest:
        mode === "firefox" ? "./manifest.firefox.json" : "./manifest.json",
    }),
  ],
}));
