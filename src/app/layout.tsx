import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import "@fontsource-variable/inter";
import "@fontsource-variable/lora";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { THEME_COOKIE } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Meu Axé é o seu espaço pessoal de estudos, conhecimentos e anotações sobre Umbanda: caderno digital, biblioteca de arquivos, diário espiritual e pesquisa, tudo privado e organizado.",
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F6F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0C1F19" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const theme = store.get(THEME_COOKIE)?.value;
  const dark = theme === "dark";

  return (
    <html lang="pt-BR" className={dark ? "dark" : ""} suppressHydrationWarning>
      <body className="bg-bg text-ink font-sans antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=JSON.parse(localStorage.getItem('mx-a11y')||'{}');var el=document.documentElement;if(p.rm)el.classList.add('reduce-motion');if(p.lt)el.classList.add('large-text');}catch(e){};try{if('serviceWorker' in navigator && location.hostname!=='localhost'){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
