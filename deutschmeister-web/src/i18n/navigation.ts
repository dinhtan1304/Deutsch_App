import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware wrappers around next/navigation. Import Link / useRouter /
// usePathname / redirect FROM HERE (not next/link or next/navigation) when
// you need them to preserve the active locale automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
