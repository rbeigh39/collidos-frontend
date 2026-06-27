import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/getErrorMessage";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = (location.state as { from?: Location })?.from?.pathname ?? "/";
  const justVerified = searchParams.get("verified") === "1";
  const justReset = searchParams.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setUnverified(false);
    setNote(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if ((err as { code?: string })?.code === "EMAIL_NOT_VERIFIED") {
        setUnverified(true);
        setError("Your email isn't verified yet. Check your inbox or resend the link.");
      } else {
        setError(getErrorMessage(err, "Unable to sign in"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function resendVerification() {
    setNote(null);
    await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}/login?verified=1`,
    });
    setNote("Verification email sent. Check your inbox.");
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to plan your day"
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {justVerified ? (
        <p className="mb-4 rounded-control bg-primary-soft px-3 py-2 text-sm text-primary">
          Email verified — you can sign in now.
        </p>
      ) : null}
      {justReset ? (
        <p className="mb-4 rounded-control bg-primary-soft px-3 py-2 text-sm text-primary">
          Password updated — sign in with your new password.
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {note ? <p className="text-sm text-primary">{note}</p> : null}
        {unverified ? (
          <Button type="button" variant="ghost" className="w-full" onClick={resendVerification}>
            Resend verification email
          </Button>
        ) : null}
        <Button type="submit" isLoading={submitting} className="mt-1 w-full">
          Sign in
        </Button>
        <Link
          to="/forgot-password"
          className="text-center text-sm text-ink-muted hover:text-primary hover:underline"
        >
          Forgot your password?
        </Link>
      </form>
    </AuthLayout>
  );
}
