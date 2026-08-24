import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ROLE_HOME_ROUTES } from '../../constants/roles';

export function Unauthorized() {
  const { user } = useAuthStore();
  const homeRoute = user?.role ? ROLE_HOME_ROUTES[user.role] : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-5 rounded-2xl border border-border bg-surface p-8 shadow-lg">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-amber-100 text-amber-800 border border-amber-200">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Access Restricted (403)</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your current account role <span className="font-bold text-primary font-mono">[{user?.role || 'ANONYMOUS'}]</span> does not have administrative permissions to view this endpoint.
          </p>
        </div>

        <div className="pt-2">
          <Link to={homeRoute}>
            <Button className="w-full bg-primary hover:bg-agri-700 text-white font-semibold">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to My Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
