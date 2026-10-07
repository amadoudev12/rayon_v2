import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

/** En-têtes de sécurité des pages du site (à reprendre chez l'hébergeur en production). */
const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.API_PROXY_TARGET || "http://localhost:4000";
  // Si l'API est appelée sur une autre origine (VITE_API_URL), elle doit être autorisée par la CSP.
  const apiOrigin = env.VITE_API_URL ? ` ${new URL(env.VITE_API_URL).origin}` : "";
  const contentSecurityPolicy = `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'${apiOrigin}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`;

  // Le site appelle `/api/...` sur sa propre origine ; le serveur Vite
  // transmet au backend. Le cookie de session reste ainsi « first-party ».
  const proxy = { "/api": { target: apiTarget, changeOrigin: true } };

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    server: { port: 5173, strictPort: true, proxy, headers: SECURITY_HEADERS },
    preview: {
      port: 5173,
      strictPort: true,
      proxy,
      headers: { ...SECURITY_HEADERS, "Content-Security-Policy": contentSecurityPolicy },
    },
  };
});
