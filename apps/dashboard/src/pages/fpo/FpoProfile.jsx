import { useAuthStore } from '../../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Layers, MapPin, Users, Phone, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function FpoProfile() {
  const { user } = useAuthStore();

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('FPO Cooperative profile updated');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">FPO Cooperative Profile</h2>
        <p className="text-xs text-muted-foreground">
          Manage your producer organization registration, cluster jurisdiction, and member governance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            FPO Society Registration Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">FPO Society Name</label>
              <Input defaultValue={user?.orgName || 'Godavari Farmer Producer Co.'} readOnly />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">President / General Secretary</label>
              <Input defaultValue={user?.name || 'Anil Jadhav'} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Official Email</label>
              <Input defaultValue={user?.email || 'fpo@godavari.org'} readOnly />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Operational Cluster District</label>
              <Input defaultValue="Nashik, Maharashtra" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Security & Access Credentials
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
              <Button type="submit" className="bg-primary hover:bg-agri-700 text-white font-semibold">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
