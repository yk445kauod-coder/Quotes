
import { FileText, Calculator } from "lucide-react";
import { LoadingLink } from "./loading-link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <LoadingLink href="/" className="mr-6 flex items-center space-x-2">
          <FileText className="h-6 w-6" />
          <span className="font-bold sm:inline-block">
            Al-Masria E-Quotes
          </span>
        </LoadingLink>
        <nav className="flex items-center gap-6 text-sm">
          <LoadingLink
            href="/"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            لوحة التحكم
          </LoadingLink>
          <LoadingLink
            href="/create"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            إنشاء مستند
          </LoadingLink>
          <LoadingLink
            href="/settings"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            الإعدادات
          </LoadingLink>
          <LoadingLink
            href="/calculator"
            className="flex items-center transition-colors hover:text-foreground/80 text-foreground/60"
          >
            <Calculator className="ms-1 h-4 w-4" />
            حاسبة
          </LoadingLink>
        </nav>
      </div>
    </header>
  );
}

    