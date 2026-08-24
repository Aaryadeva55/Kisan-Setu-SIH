import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { NAV_CONFIG_BY_ROLE } from '../../routes/roleRoutes';
import { Sprout, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sidebar({ className }) {
  const { user } = useAuthStore();
  const role = user?.role || 'BUYER';
  const navItems = NAV_CONFIG_BY_ROLE[role] || NAV_CONFIG_BY_ROLE.BUYER;

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-surface select-none h-screen sticky top-0',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
          <Sprout className="h-5 w-5" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-foreground block leading-tight">
            Kisan Setu
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-agri-600">
            Market Linkage
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {role.replace('_', ' ')} PORTAL
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-agri-100/70 text-primary font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground'
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110 text-current" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary/20 text-secondary-foreground">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Institutional Compliance Seal */}
      <div className="p-4 border-t border-border/80 bg-surface-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span className="leading-tight text-[11px]">
            Govt. of Maharashtra Agri-Stack Pilot Compliant
          </span>
        </div>
      </div>
    </aside>
  );
}
