import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-6 px-4 sm:px-8 text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>
            © 2026 Kisan Setu — Smart India Hackathon & Government of Maharashtra Agri-Stack Pilot.
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="hover:text-foreground transition-colors cursor-pointer">Security Policy</span>
          <span>•</span>
          <span className="hover:text-foreground transition-colors cursor-pointer">API Docs</span>
          <span>•</span>
          <span className="text-primary font-semibold">v1.4.0 (SIH-Demo)</span>
        </div>
      </div>
    </footer>
  );
}
