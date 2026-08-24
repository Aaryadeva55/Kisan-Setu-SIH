import { Sheet, SheetContent } from '../ui/sheet';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { NAV_CONFIG_BY_ROLE } from '../../routes/roleRoutes';
import { Sprout } from 'lucide-react';
import { cn } from '../../lib/utils';

export function MobileNav({ open, onOpenChange }) {
  const { user } = useAuthStore();
  const role = user?.role || 'BUYER';
  const navItems = NAV_CONFIG_BY_ROLE[role] || NAV_CONFIG_BY_ROLE.BUYER;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-foreground block leading-tight">
              Kisan Setu
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-agri-600">
              {role}
            </span>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onOpenChange(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-agri-100/70 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 text-current" />
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
      </SheetContent>
    </Sheet>
  );
}
