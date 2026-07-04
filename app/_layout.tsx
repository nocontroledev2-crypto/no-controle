// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.lang = "pt-BR";
    document.documentElement.setAttribute("translate", "no");
    document.documentElement.classList.add("notranslate");

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
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}