"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
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

    setMessage("Login validated. Connect backend auth to complete sign-in.");
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          {error ? <p className="auth-error">{error}</p> : null}
          {message ? <p className="auth-success">{message}</p> : null}

          <button type="submit" className="btn primary auth-submit">
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          <span>Don&apos;t have an account?</span>
          <button type="button" className="auth-link-btn">
            Create account
          </button>
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
