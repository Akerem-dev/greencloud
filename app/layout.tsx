import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import { AppStateProvider } from "@/components/providers/app-state-provider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GreenCloud",
    template: "%s · GreenCloud",
  },
  description:
    "GreenCloud is a secure smart irrigation workspace for paired ESP32 plant monitoring devices.",
  applicationName: "GreenCloud",
  appleWebApp: {
    capable: true,
    title: "GreenCloud",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#050a0d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const themeInitScript = `
(function () {
  try {
    var raw =
      window.localStorage.getItem("greencloud-app-state-v10") ||
      window.localStorage.getItem("greencloud-app-state-final-v9") ||
      window.localStorage.getItem("greencloud-app-state-ultra-v5") ||
      window.localStorage.getItem("greencloud-app-state-ultra-v4");

    var parsed = raw ? JSON.parse(raw) : {};
    var settings = parsed && parsed.settings ? parsed.settings : {};

    var allowedThemes = {
      "botanical-dark": true,
      "forest-mist": true,
      "aurora-gold": true,
      "midnight-moss": true,
      "golden-hour": true,
      "rain-glass": true
    };

    var allowedAmbiences = {
      "leaves": true,
      "rain": true,
      "mist": true,
      "wind": true,
      "fireflies": true,
      "calm": true
    };

    var theme = settings.themePreset || settings.theme || "rain-glass";
    var compact = settings.compactMode ? "true" : "false";
    var motion = settings.animations === false ? "off" : "on";
    var ambience = settings.leafAmbience === false
      ? "calm"
      : settings.ambienceMode || "rain";

    if (!allowedThemes[theme]) {
      theme = "rain-glass";
    }

    if (!allowedAmbiences[ambience]) {
      ambience = "rain";
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.compact = compact;
    document.documentElement.dataset.motion = motion;
    document.documentElement.dataset.ambience = ambience;
  } catch (error) {
    document.documentElement.dataset.theme = "rain-glass";
    document.documentElement.dataset.compact = "false";
    document.documentElement.dataset.motion = "on";
    document.documentElement.dataset.ambience = "rain";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={manrope.variable}
      data-theme="rain-glass"
      data-compact="false"
      data-motion="on"
      data-ambience="rain"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>

      <body>
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}