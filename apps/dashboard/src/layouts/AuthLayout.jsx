import { Outlet, Link } from 'react-router-dom';
import { Sprout, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-agri-50 via-background to-surface-muted p-4 sm:p-6 lg:p-8">
      {/* Brand Header */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-foreground block leading-none">
              Kisan Setu
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-agri-600">
              Direct Agri Market Linkage
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs font-semibold text-primary hover:text-agri-700 bg-surface px-3 py-1.5 rounded-lg border border-border shadow-2xs transition-colors"
        >
          ← Back to Main Showcase
        </Link>
      </div>

      {/* Main Form Center Box */}
      <div className="my-8 max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Narrative Column (Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 pr-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-agri-200 bg-agri-100/60 px-3 py-1 text-xs font-semibold text-agri-900 w-fit">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Smart India Hackathon 2026 Initiative</span>
          </div>

          <h2 className="text-3xl font-extrabold text-foreground tracking-tight leading-tight">
            From Advisory to Closed Transaction — Linking India’s Farmers & Buyers
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Institutional buyers post demand, smallholders receive tailored WhatsApp advisories, and the loop is closed with verifiable digital settlements.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>Instant WhatsApp Farmer Alert upon Buyer Acceptance</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>Multi-Factor Explainable Match Scoring Algorithm</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>Full Audit Trail Compliant with Maharashtra Agri-Stack</span>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="w-full lg:col-span-6 max-w-md mx-auto">
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xl">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        © 2026 Kisan Setu. Department of Agriculture, Government of Maharashtra Pilot.
      </div>
    </div>
  );
}
