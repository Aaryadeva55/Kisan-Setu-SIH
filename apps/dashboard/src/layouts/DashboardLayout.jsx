import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { MobileNav } from '../components/layout/MobileNav';
import { Footer } from '../components/layout/Footer';

export function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Compute a clean title based on pathname
  const getPageTitle = (pathname) => {
    if (pathname.includes('/overview')) return 'Platform Overview';
    if (pathname.includes('/buyer/dashboard')) return 'Buyer Operations Hub';
    if (pathname.includes('/buyer/requests')) return 'Incoming Matched Farmer Requests';
    if (pathname.includes('/buyer/requirements')) return 'Crop Procurement Requirements';
    if (pathname.includes('/fpo/dashboard')) return 'FPO Cooperative Operations';
    if (pathname.includes('/fpo/bundle')) return 'Multi-Farmer Demand Aggregator';
    if (pathname.includes('/farmers')) return 'Farmer Directory & Advisory History';
    if (pathname.includes('/transactions')) return 'Auditable Transactions Ledger';
    if (pathname.includes('/analytics')) return 'Agricultural Analytics & Heatmap';
    if (pathname.includes('/system-health')) return 'Pipeline ETL & System Health';
    if (pathname.includes('/market-prices')) return 'APMC Mandi Real-Time Prices';
    if (pathname.includes('/weather')) return 'IMD Agro-Meteorological Intel';
    if (pathname.includes('/recommendations')) return 'Explainable Advisory Engine';
    if (pathname.includes('/profile')) return 'Organization Profile';
    return 'Kisan Setu Dashboard';
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} title={getPageTitle(location.pathname)} />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-200">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
