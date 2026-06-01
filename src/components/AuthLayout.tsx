import { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Centered, calm two-line-header card used by the login & register screens. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-card bg-primary text-lg font-semibold text-white">
            ☼
          </div>
          <h1 className="text-xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
        </div>

        <div className="card p-6">{children}</div>

        <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>
      </div>
    </div>
  );
}
