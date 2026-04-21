import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  sidebar?: ReactNode;
  header?: ReactNode;
  children?: ReactNode;
}

export const MainLayout = ({ sidebar, header, children }: MainLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          'hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-bg-subtle',
        )}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
          <span className="text-lg font-semibold">Abbynbev CMS</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <nav className="p-4">{sidebar}</nav>
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle className="text-left">Abbynbev CMS</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-65px)] overflow-y-auto">
            <nav className="p-4">{sidebar}</nav>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Separator orientation="vertical" className="h-6 lg:hidden" />
          <div className="flex flex-1 items-center justify-end gap-2">{header}</div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};
