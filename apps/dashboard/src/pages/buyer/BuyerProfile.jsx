import { useAuthStore } from '../../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Building2, Mail, MapPin, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function BuyerProfile() {
  const { user } = useAuthStore();

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Organization profile updated');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Organization Profile</h2>
        <p className="text-xs text-muted-foreground">
          Manage your buyer entity credentials, operational hubs, and security settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Buyer Entity Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Registered Company Name</label>
              <Input defaultValue={user?.orgName || 'Sahyadri Agri Processors Ltd'} readOnly />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Authorized Representative</label>
              <Input defaultValue={user?.name || 'Vikas Shinde'} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Contact Email</label>
              <Input defaultValue={user?.email || 'buyer@sahyadri.com'} readOnly />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Primary Procurement Hub</label>
              <Input defaultValue={user?.district || 'Nashik, Maharashtra'} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Current Password</label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">New Password</label>
                <Input type="password" placeholder="••••••••" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="default" className="bg-primary hover:bg-agri-700 text-white font-semibold">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
