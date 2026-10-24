import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// האתר מוגש מ-GitHub Pages בנתיב /TavlaMachzorit-GH/
export default defineConfig({
  plugins: [react()],
  base: "/TavlaMachzorit-GH/",
  build: { chunkSizeWarningLimit: 700 },
});
