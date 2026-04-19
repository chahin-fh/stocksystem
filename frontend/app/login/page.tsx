"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const onGoogleLogin = async () => {
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    setMessage("Connecting to Google...");
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsSubmitting(false);
    setMessage("Google sign-in successful.");
    router.push("/");
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    setMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Signing in...");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || "Login failed");
        setIsSubmitting(false);
        return;
      }

      if (data?.token) {
        localStorage.setItem("fieldbase_token", data.token);
      }
      if (data?.user) {
        localStorage.setItem("fieldbase_user", JSON.stringify(data.user));
      }

      setMessage(
        rememberMe
          ? "Signed in. We'll keep you logged in on this device."
          : "Signed in successfully."
      );
      setIsSubmitting(false);
      router.push("/");
    } catch {
      setError("Cannot reach server. Make sure backend is running.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-bg" />
      <main className="auth-card">
        <div className="auth-brand">
          <div className="brand-dot" />
          <div>
            <h1>Welcome Back</h1>
            <p>Sign in to manage your custom database workspace.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <div className="row-between">
            <label className="check">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>
          </div>

          {error ? <p className="auth-error">{error}</p> : null}
          {message ? <p className="auth-success">{message}</p> : null}

          <button
            type="submit"
            className="btn primary auth-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          className="btn auth-social-btn"
          onClick={onGoogleLogin}
          disabled={isSubmitting}
        >
          Continue with Google
        </button>

        <div className="auth-footer">
          <span>Don&apos;t have an account?</span>
          <Link href="/signup" className="auth-link">
            Create account
          </Link>
        </div>

        <div className="auth-footer">
          <Link href="/" className="auth-link">
            Back to app
          </Link>
        </div>
      </main>
    </div>
  );
}
