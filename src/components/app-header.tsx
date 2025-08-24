import Link from "next/link";
import { Sheet, FileText, Settings } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <FileText className="h-6 w-6" />
          <span className="font-bold sm:inline-block">
            Al-Masria E-Quotes
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            لوحة التحكم
          </Link>
          <Link
            href="/create"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            إنشاء مستند
          </Link>
          <Link
            href="/settings"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            الإعدادات
          </Link>
        </nav>
      </div>
    </header>
  );
}
