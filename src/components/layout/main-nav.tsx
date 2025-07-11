'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const routes = [
    { href: '/', label: 'Dashboard' },
    { href: '/proxy', label: 'Proxy' },
    { href: '/playground', label: 'Playground' },
    { href: '/keys', label: 'AI Keys' },
    { href: '/api-keys', label: 'API Keys' },
    { href: '/integration', label: 'Integration' },
  ];

  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      <Link href="/" className="flex items-center gap-2 mr-6">
        <Flame className="h-6 w-6 text-primary" />
        <span className="font-headline text-2xl font-bold tracking-wider text-foreground">
          AICache
        </span>
      </Link>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary relative',
            pathname === route.href
              ? 'text-primary'
              : 'text-muted-foreground'
          )}
        >
          {route.label}
          {pathname === route.href && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-[2px] bg-primary rounded-full"></span>
          )}
        </Link>
      ))}
    </nav>
  );
}
