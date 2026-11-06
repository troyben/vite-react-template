import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** Shared page chrome. Keep it inside the same scroll container as the content. */
export function PageHeader({ className, ...props }: ComponentProps<'header'>) {
  return <header {...props} className={cn(
    'sticky top-0 z-30 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-background py-3 [&>div]:min-w-0',
    className,
  )} />;
}
