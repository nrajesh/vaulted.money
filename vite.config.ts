import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  server: {
    host: "::",
    port: 8081,
  },
  preview: {
    port: 62153,
  },
  base: "./",
  plugins: [
    react(),
    {
      name: "html-csp",
      apply: "build",
      transformIndexHtml(html) {
        // connect-src uses https: wildcard because users configure arbitrary
        // BYOK AI endpoints — a hardcoded allowlist would break custom providers.
        // script/style/font/frame remain tightly scoped.
        const connectSrc = [
          "'self'",
          "https:",
          "http://localhost:*",
          "http://127.0.0.1:*",
          "wss://ws-us3.pusher.com",
        ].join(" ");

        return html.replace(
          "<head>",
          `<head>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src ${connectSrc}; frame-src 'self'; font-src 'self' data:;">`,
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Library code is split along the app's lazy routes by the bundler. A
    // single forced "vendor" chunk made every first visit download all of it,
    // including the PDF export and the homepage animations.
    chunkSizeWarningLimit: 600,
  },
}));
