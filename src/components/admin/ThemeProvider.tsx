"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Wraps the admin UI so next-themes can toggle `<html class="dark">`.
 *
 * `attribute="class"` is required by shadcn's `.dark` selector in globals.css.
 * `defaultTheme="dark"` honors the user's product ask.
 * `enableSystem` still picks up OS preference on first visit — users on
 * light OS see dark unless they actively flip to system/light via the toggle.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
