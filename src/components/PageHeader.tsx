import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** Shared page chrome. Keep it inside the same scroll container as the content. */
export function PageHeader({ className, ...props }: ComponentProps<'header'>) {
  return <header {...props} className={cn(
    'sticky top-0 z-30 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b bg-background py-1.5 [&>div]:min-w-0 [&_h1]:text-lg [&_h1]:leading-6 [&_p]:mt-0 [&_p]:text-xs [&_p]:leading-4 [&_[data-slot=button]]:h-8 [&_[data-slot=button]]:text-xs [&_a]:h-8 [&_a]:text-xs',
    className,
  )} />;
}
