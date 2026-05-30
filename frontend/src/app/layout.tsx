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
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

