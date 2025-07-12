import { SidebarTrigger } from '@/components/ui/sidebar';

type SiteHeaderProps = {
  buildNumber?: string;
};

export function SiteHeader({ buildNumber }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between space-x-4">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {buildNumber && (
            <div className="text-xs text-muted-foreground font-code">
              Build {buildNumber}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
