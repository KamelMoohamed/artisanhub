import "./globals.css";

// Root layout is minimal — html/body are provided by app/[locale]/layout.tsx
// so every route gets the correct lang and dir attributes.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children as React.ReactElement;
}
