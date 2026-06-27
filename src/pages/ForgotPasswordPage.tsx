import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/getErrorMessage";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error: reqError } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (reqError) throw new Error(reqError.message || "Unable to send reset email");
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to send reset email"));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`If an account exists for ${email}, a reset link is on its way`}
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <p className="text-sm text-ink-muted">
          Open the link in that email to choose a new password. It expires shortly for
          security.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to set a new one"
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" isLoading={submitting} className="mt-1 w-full">
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
