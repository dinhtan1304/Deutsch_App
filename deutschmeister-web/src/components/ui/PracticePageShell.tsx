'use client';

import { AppPageShell, type AppPageShellProps } from './AppPageShell';

export function PracticePageShell(props: Omit<AppPageShellProps, 'maxWidth'>) {
  return <AppPageShell {...props} maxWidth="wide" />;
}
