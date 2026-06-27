import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/authClient";
import { getErrorMessage } from "@/lib/getErrorMessage";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error"); // e.g. INVALID_TOKEN

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Bad/expired link: no usable token.
  if (linkError || !token) {
    return (
      <AuthLayout
        title="Link expired"
        subtitle="This password reset link is invalid or has expired"
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          Request a new reset link
        </Link>
      </AuthLayout>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token: token as string,
      });
      if (resetError) throw new Error(resetError.message || "Unable to reset password");
      navigate("/login?reset=1", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to reset password"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Enter a new password for your account"
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" isLoading={submitting} className="mt-1 w-full">
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
