import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import {
  Sprout,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Building2,
  ReceiptText,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useAdminOverview } from '../../hooks/useAdminOverview';

export function Landing() {
  const { data } = useAdminOverview();
  const metrics = data?.metrics || {
    totalFarmersReached: 1850,
    activeSellIntents: 16,
    estimatedGmvClosed: 3450000,
  };

  const steps = [
    {
      step: '01',
      title: 'Farmer on WhatsApp',
      desc: 'Smallholders interact via simple conversational AI in Marathi & Hindi for crop advisories and registered sell intents with zero app installation.',
      icon: MessageSquare,
      color: 'bg-emerald-100 text-emerald-800',
    },
    {
      step: '02',
      title: 'Buyer Posts Real Demand',
      desc: 'Food processors, exporters, and mills post lot requirements with quantity, price ceilings, and assaying grades.',
      icon: Building2,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      step: '03',
      title: 'Explainable AI Matching',
      desc: 'Multi-factor weighted engine scores distance, quantity, price, grade, and harvest windows with 100% transparent factor breakdowns.',
      icon: Sparkles,
      color: 'bg-amber-100 text-amber-800',
    },
    {
      step: '04',
      title: 'Closed Transaction & Audit',
      desc: 'Buyer clicks Accept → Farmer receives instant WhatsApp delivery slip → Admin overview KPI logs closed GMV with full audit trail.',
      icon: ReceiptText,
      color: 'bg-agri-100 text-agri-800',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-foreground block leading-none">
                Kisan Setu
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-agri-600">
                Direct Market Linkage
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="default" className="bg-primary hover:bg-agri-700 text-white font-semibold shadow-sm">
                Log In to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-6 bg-gradient-to-b from-agri-50/70 via-background to-background">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-agri-200 bg-agri-100/70 px-4 py-1.5 text-xs font-semibold text-agri-900 shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Smart India Hackathon 2026 • Government of Maharashtra Agri-Stack Pilot</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            From Advisory to a <span className="text-primary underline decoration-secondary decoration-wavy decoration-2">Real Sale</span> — Closing India’s Agri Market-Linkage Gap
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Bridging 140+ million smallholder farmers with institutional buyers through conversational WhatsApp intelligence and a verifiable, auditable transaction ledger.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/login">
              <Button size="lg" className="bg-primary hover:bg-agri-700 text-white text-base px-8 h-12 shadow-lg">
                Access Web Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/buyer/requests">
              <Button size="lg" variant="outline" className="border-agri-300 text-agri-900 hover:bg-agri-50 h-12">
                View Live Demo Flow
              </Button>
            </Link>
          </div>

          {/* Live Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 max-w-4xl mx-auto text-left">
            <Card className="border-border/80 bg-surface/80 backdrop-blur shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Sprout className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Farmers Connected</span>
                  <div className="text-2xl font-bold text-foreground">{metrics.totalFarmersReached}+</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-surface/80 backdrop-blur shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Active Sell Intents</span>
                  <div className="text-2xl font-bold text-foreground">{metrics.activeSellIntents} Open</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-surface/80 backdrop-blur shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Closed GMV Realized</span>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.estimatedGmvClosed)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Four-Stage Narrative Funnel */}
      <section className="py-16 px-6 bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-widest text-primary">The Closed Loop Solution</span>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">How Kisan Setu Works</h2>
            <p className="text-sm text-muted-foreground">
              A 4-pillar architectural flow connecting farm-gate production to verified payment realization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.step} className="border-border/80 hover:border-primary/50 transition-all hover:shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-extrabold text-muted-foreground/30">{s.step}</span>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-foreground">{s.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-background py-8 px-6 text-xs text-muted-foreground text-center">
        <div className="max-w-6xl mx-auto space-y-2">
          <p>© 2026 Kisan Setu — Smart India Hackathon Agricultural Direct Market Linkage Initiative.</p>
          <p className="text-[11px] text-muted-foreground/70">
            Developed for Department of Agriculture & Farmers Welfare, Government of Maharashtra.
          </p>
        </div>
      </footer>
    </div>
  );
}
