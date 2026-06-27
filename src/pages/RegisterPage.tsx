import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/getErrorMessage";

export function RegisterPage() {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password);
      setRegistered(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create account"));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setResendNote(null);
    await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}/login?verified=1`,
    });
    setResendNote("Verification email sent again.");
  }

  // Post-signup: prompt the user to verify before they can sign in.
  if (registered) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`We sent a verification link to ${email}`}
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">
            Open the link in that email to verify your address, then sign in. The link can
            take a minute to arrive.
          </p>
          {resendNote ? <p className="text-sm text-primary">{resendNote}</p> : null}
          <Button variant="ghost" className="w-full" onClick={resend}>
            Resend verification email
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start planning intentional days"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" isLoading={submitting} className="mt-1 w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
