"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { generateRSAKeyPair, encryptData, decryptData } from "../utils/crypto";

export interface User {
  username: string;
  loginMethod: "credentials" | "google" | "apple" | "phone";
  encryptedPhone?: string;
  decryptedPhone?: string; // Decrypted on the dashboard to prove it works
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  publicKey: CryptoKey | null;
  privateKey: CryptoKey | null;
  loginWithCredentials: (username: string, password: string) => Promise<boolean>;
  loginWithSocial: (provider: "google" | "apple") => Promise<boolean>;
  loginWithPhone: (phoneNumber: string) => Promise<string>; // Returns the encrypted phone number
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep the RSA key pair in memory
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);

  // Initialize: Load session from localStorage and generate RSA key pair
  useEffect(() => {
    // 1. Session restoration
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("giving_is_lekker_session");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Failed to parse saved session", e);
        }
      }
    }

    // 2. RSA keypair generation
    async function initCrypto() {
      try {
        const keys = await generateRSAKeyPair();
        setKeyPair(keys);
        console.log("RSA-OAEP Key Pair generated successfully for frontend session.");
      } catch (err) {
        console.error("Failed to initialize Web Crypto:", err);
      }
    }
    initCrypto();
  }, []);

  // Standard username and password login (mock validation)
  const loginWithCredentials = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!username || !password) {
      setError("Please enter both username and password.");
      setIsLoading(false);
      return false;
    }

    // Basic email validation helper
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
    if (!isEmail) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return false;
    }

    // Accepted mock login
    const newUser: User = {
      username: username,
      loginMethod: "credentials",
    };

    setUser(newUser);
    localStorage.setItem("giving_is_lekker_session", JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  // Google and Apple mock logins
  const loginWithSocial = async (provider: "google" | "apple"): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const providerNames = {
      google: "Google User",
      apple: "Apple User",
    };

    const newUser: User = {
      username: `${providerNames[provider]} (${provider === "google" ? "user@gmail.com" : "apple.id@icloud.com"})`,
      loginMethod: provider,
    };

    setUser(newUser);
    localStorage.setItem("giving_is_lekker_session", JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  // Phone Number login with Frontend Encryption
  const loginWithPhone = async (phoneNumber: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Basic South Africa / international phone regex validation (typically 9-12 digits)
    const cleanedPhone = phoneNumber.replace(/\D/g, "");
    if (cleanedPhone.length < 9) {
      setError("Please enter a valid phone number.");
      setIsLoading(false);
      throw new Error("Invalid phone number");
    }

    if (!keyPair || !keyPair.publicKey) {
      setError("Security system is initializing. Please try again in a moment.");
      setIsLoading(false);
      throw new Error("RSA Keypair not ready");
    }

    try {
      // ENCRYPT PHONE NUMBER ON FRONTEND - RSA-OAEP
      const fullPhoneNumber = `+27${cleanedPhone}`; // Standardized prefix
      const cipherText = await encryptData(fullPhoneNumber, keyPair.publicKey);
      
      console.log("=== FRONTEND SECURE ENCRYPTION ===");
      console.log("Raw Phone Entered:", fullPhoneNumber);
      console.log("Encrypted Payload (Base64 RSA-OAEP):", cipherText);
      console.log("==================================");

      // Decrypt locally to verify and display on dashboard for the user experience
      let verifiedDecrypted = "";
      if (keyPair.privateKey) {
        verifiedDecrypted = await decryptData(cipherText, keyPair.privateKey);
      }

      const newUser: User = {
        username: `Phone Auth (${fullPhoneNumber.substring(0, 6)}***${fullPhoneNumber.slice(-3)})`,
        loginMethod: "phone",
        encryptedPhone: cipherText,
        decryptedPhone: verifiedDecrypted, // Kept to show decryption was successful
      };

      setUser(newUser);
      localStorage.setItem("giving_is_lekker_session", JSON.stringify(newUser));
      setIsLoading(false);
      return cipherText;
    } catch (err) {
      console.error("Encryption error:", err);
      setError("Failed to securely encrypt phone number. Please try again.");
      setIsLoading(false);
      throw err;
    }
  };

  // Logout session
  const logout = () => {
    setUser(null);
    localStorage.removeItem("giving_is_lekker_session");
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        publicKey: keyPair?.publicKey ?? null,
        privateKey: keyPair?.privateKey ?? null,
        loginWithCredentials,
        loginWithSocial,
        loginWithPhone,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
