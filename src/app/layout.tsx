// src/app/layout.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import { auth } from "@/lib/auth"; // your NextAuth helper
import HomeLayout from "@/components/HomeLayout";
import { Inter } from "next/font/google";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Proof of Delivery App",
  description: "Digitize your delivery confirmations with ease.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = {
    name: session?.user?.name ?? null,
    agentId: (session?.user as any)?.agentId ?? null,
    image: session?.user?.image ?? null,
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers><HomeLayout user={user}>{children}</HomeLayout></Providers>
      </body>
    </html>
  );
}
