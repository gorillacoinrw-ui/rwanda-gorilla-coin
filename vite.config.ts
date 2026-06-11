import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// The lovable-tagger plugin injects the "Edit with Lovable" badge during
// development. Disable it by default to remove the badge from the dev UI.
// If you need the tagger later, uncomment the import and the plugin line.
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  // Remove `componentTagger()` to avoid the Lovable badge overlay.
  // To re-enable the tagger for local editing, restore the import above
  // and change this line back to include `componentTagger()` when mode === "development".
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
