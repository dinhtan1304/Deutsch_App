// Root layout is a passthrough — `<html>` and `<body>` live in
// `app/[locale]/layout.tsx` so the lang attribute can be set per request.
// Next.js permits this when there's exactly one dynamic top-level segment
// (`[locale]`), which the next-intl middleware ensures every visible route
// resolves through.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
