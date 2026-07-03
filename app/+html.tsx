import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR" translate="no" className="notranslate">
      <head>
        <meta charSet="utf-8" />
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content="pt-BR" />

        <ScrollViewStyleReset />
      </head>

      <body>{children}</body>
    </html>
  );
}