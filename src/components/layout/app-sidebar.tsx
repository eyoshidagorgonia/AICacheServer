
'use client';

import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Flame, LayoutDashboard, TestTube, KeyRound, Server, Bot, FileCode, Settings, Code, Zap } from 'lucide-react';
import Link from 'next/link';

export function AppSidebar() {
  const pathname = usePathname();
  const routes = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/proxy', label: 'Proxy', icon: Zap },
    { href: '/playground', label: 'Playground', icon: TestTube },
    { href: '/keys', label: 'AI Keys', icon: KeyRound },
    { href: '/api-keys', label: 'API Keys', icon: Server },
    { href: '/models', label: 'Models', icon: Bot },
    { href: '/documentation', label: 'Docs', icon: FileCode },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
            <Flame className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-bold tracking-wider text-foreground">
            AICache
            </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {routes.map((route) => (
            <SidebarMenuItem key={route.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === route.href}
                tooltip={route.label}
              >
                <Link href={route.href}>
                  <route.icon />
                  <span>{route.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
