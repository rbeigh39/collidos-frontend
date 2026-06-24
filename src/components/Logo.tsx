import { Sun } from "lucide-react";

/**
 * The Colloidos brand mark — a sun. Inherits `currentColor` and sizes via
 * `className`, so it fills whatever box it's dropped into. The favicon
 * (`public/favicon.svg`) mirrors this same shape.
 */
export function Logo({ className }: { className?: string }) {
  return <Sun className={className} strokeWidth={2.5} aria-hidden />;
}
