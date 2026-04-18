import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Canonical shadcn/ui class-merger helper. Used by every admin UI
 * component so Tailwind classes from props cleanly override or extend
 * the defaults (last-write-wins semantics via twMerge).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
