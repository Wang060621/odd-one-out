import type { Metadata } from "next";
import "./clubhouse.css";
import "./painted-lobby.css";

export const metadata: Metadata = {
  title: "Odd One Out — A little different. A lot of fun.",
  description: "A multiplayer word party game for 3–8 friends. Private word cards, curious clues and one odd player.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
