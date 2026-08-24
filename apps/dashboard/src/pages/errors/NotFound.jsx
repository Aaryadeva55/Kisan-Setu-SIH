import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Compass, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-5 rounded-2xl border border-border bg-surface p-8 shadow-lg">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted text-muted-foreground border">
          <Compass className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Page Not Found (404)</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The requested platform URL does not exist or has been relocated within the Kisan Setu portal.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/">
            <Button className="w-full bg-primary hover:bg-agri-700 text-white font-semibold">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
