import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
// Police auto-hébergée (aucune requête vers un service tiers), utilisée par `--font-sans`.
import "@fontsource-variable/inter";
import "./globals.css";
import { router } from "./router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
