// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    function applyWebMetadata() {
      document.documentElement.lang = "pt-BR";
      document.documentElement.setAttribute("translate", "no");
      document.documentElement.classList.add("notranslate");

      let viewportMeta = document.querySelector('meta[name="viewport"]');

      if (!viewportMeta) {
        viewportMeta = document.createElement("meta");
        viewportMeta.setAttribute("name", "viewport");
        document.head.appendChild(viewportMeta);
      }

      viewportMeta.setAttribute(
        "content",
        "width=device-width, initial-scale=1, viewport-fit=cover"
      );

      let googleMeta = document.querySelector('meta[name="google"]');

      if (!googleMeta) {
        googleMeta = document.createElement("meta");
        googleMeta.setAttribute("name", "google");
        document.head.appendChild(googleMeta);
      }

      googleMeta.setAttribute("content", "notranslate");

      let languageMeta = document.querySelector(
        'meta[http-equiv="Content-Language"]'
      );

      if (!languageMeta) {
        languageMeta = document.createElement("meta");
        languageMeta.setAttribute("http-equiv", "Content-Language");
        document.head.appendChild(languageMeta);
      }

      languageMeta.setAttribute("content", "pt-BR");
    }

    applyWebMetadata();

    window.addEventListener("pageshow", applyWebMetadata);
    window.addEventListener("focus", applyWebMetadata);
    document.addEventListener("visibilitychange", applyWebMetadata);

    return () => {
      window.removeEventListener("pageshow", applyWebMetadata);
      window.removeEventListener("focus", applyWebMetadata);
      document.removeEventListener("visibilitychange", applyWebMetadata);
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}