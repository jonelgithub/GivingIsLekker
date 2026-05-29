"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import DotField from "@/components/DotField";
import { encryptData } from "@/utils/crypto";

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    isLoading,
    error,
    publicKey,
    loginWithCredentials,
    loginWithSocial,
    loginWithPhone,
    clearError,
  } = useAuth();

  // Tabs: 'credentials' or 'phone'
  const [activeTab, setActiveTab] = useState<"credentials" | "phone">("credentials");

  // Form fields state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Live encryption preview state for phone number input
  const [encryptedPreview, setEncryptedPreview] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Live encrypt phone number as the user types to visually verify security
  useEffect(() => {
    if (activeTab === "phone" && phone.replace(/\D/g, "").length >= 9 && publicKey) {
      const cleanPhone = phone.replace(/\D/g, "");
      encryptData(`+27${cleanPhone}`, publicKey)
        .then((cipher) => setEncryptedPreview(cipher))
        .catch(() => setEncryptedPreview(""));
    } else {
      setEncryptedPreview("");
    }
  }, [phone, activeTab, publicKey]);

  const handleTabChange = (tab: "credentials" | "phone") => {
    setActiveTab(tab);
    clearError();
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const success = await loginWithCredentials(email, password);
    if (success) {
      router.push("/dashboard");
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      await loginWithPhone(phone);
      router.push("/dashboard");
    } catch (err) {
      // Error is set in AuthContext
      console.error(err);
    }
  };

  const handleSocialClick = async (provider: "google" | "apple") => {
    if (isLoading) return;
    const success = await loginWithSocial(provider);
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="page-container">
      {/* Dynamic Canvas Dot Field mimicking antigravity.google */}
      <DotField />

      {/* Main Authentication Block */}
      <div className="auth-card">
        {/* Brand/Logo: Giving is lekker */}
        <div className="brand-container">
          <span className="overline">Investec Programmable Banking</span>
          <h1 className="logo-text">
            <span className="part-giving">Giving</span>
            <span className="part-is">is</span>
            <span className="part-lekker">lekker</span>
          </h1>
        </div>

        {/* Community Quote */}
        <p className="community-quote">
          &ldquo;The greatness of a community is most accurately measured by the compassionate actions of its members.&rdquo; Coretta Scott King
        </p>

        {/* Authentication Mode Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === "credentials" ? "active" : ""}`}
            onClick={() => handleTabChange("credentials")}
          >
            Credentials
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "phone" ? "active" : ""}`}
            onClick={() => handleTabChange("phone")}
          >
            Phone Number
          </button>
        </div>

        {/* Error Alert Display */}
        {error && <div className="alert-error">{error}</div>}

        {/* Credential login form */}
        {activeTab === "credentials" && (
          <form onSubmit={handleCredentialsSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="hello@givingislekker.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? <span className="loading-spinner"></span> : "Sign In"}
            </button>
          </form>
        )}

        {/* Phone login form with Frontend Encryption */}
        {activeTab === "phone" && (
          <form onSubmit={handlePhoneSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="input-wrapper">
                <span className="phone-prefix">+27</span>
                <input
                  id="phone"
                  type="tel"
                  className="phone-input"
                  placeholder="82 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Cryptographic security visualization - Live RSA Encryption indicator */}
            {phone.replace(/\D/g, "").length >= 9 && (
              <div className="security-indicator">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span className="pulsing" style={{ fontWeight: 600 }}>
                  Securing frontend...
                </span>
                <span className="cipher-preview">{encryptedPreview}</span>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? <span className="loading-spinner"></span> : "Secure Sign In"}
            </button>
          </form>
        )}

        {/* Social Authentication Options */}
        <div className="social-login-container">
          <div className="social-divider">Or continue with</div>

          <div className="social-buttons-grid">
            {/* Google Login */}
            <button
              type="button"
              className="social-btn google-btn"
              onClick={() => handleSocialClick("google")}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>

            {/* Apple Login */}
            <button
              type="button"
              className="social-btn apple-btn"
              onClick={() => handleSocialClick("apple")}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.73-1.16 1.87-1.01 2.98 1.12.09 2.27-.61 2.96-1.43z" />
              </svg>
              Apple
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
