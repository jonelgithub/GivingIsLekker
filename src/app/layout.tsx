import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthContext";
import "../styles/globals.scss";

export const metadata: Metadata = {
  title: "Giving is lekker - Secure Login",
  description: "Join Giving is lekker, a premium community platform sharing, connecting, and empowering communities across South Africa. Experience secure frontend-encrypted authentication.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

