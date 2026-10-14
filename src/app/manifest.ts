import type { MetadataRoute } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — ${APP_TAGLINE}`,
    short_name: APP_NAME,
    description:
      "Seu espaço pessoal de estudos, conhecimentos e anotações sobre Umbanda: caderno digital, diário espiritual e biblioteca privada.",
    lang: "pt-BR",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F6F0",
    theme_color: "#173D30",
    categories: ["productivity", "education", "books"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
