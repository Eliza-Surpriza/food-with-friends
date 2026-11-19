import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Food with Friends",
  description: "Find restaurant ideas for a group with different dietary needs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
