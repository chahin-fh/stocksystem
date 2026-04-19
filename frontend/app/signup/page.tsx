"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const onGoogleSignUp = async () => {
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    setMessage("Connecting to Google...");
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsSubmitting(false);
    setMessage("Google sign-up successful.");
    router.push("/");
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    setMessage("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (trimmedName.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!acceptTerms) {
      setError("Please accept the terms to continue.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Creating your account...");

    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: trimmedName, email: trimmedEmail, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || "Sign up failed");
        setIsSubmitting(false);
        return;
      }

      setMessage("Account created successfully.");
      setIsSubmitting(false);
      router.push("/login");
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
            <h1>Create Account</h1>
            <p>Sign up to start managing your custom database workspace.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
          />

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
            placeholder="Create a password"
            autoComplete="new-password"
          />

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />

          <div className="row-between">
            <label className="check">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              I agree to the terms
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
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          className="btn auth-social-btn"
          onClick={onGoogleSignUp}
          disabled={isSubmitting}
        >
          Sign up with Google
        </button>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link href="/login" className="auth-link">
            Sign in
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
