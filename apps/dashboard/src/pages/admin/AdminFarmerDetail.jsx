import { useParams, Link } from 'react-router-dom';
import { useFarmerDetail, useFarmerAdvisories, useFarmerSellIntents } from '../../hooks/useFarmers';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatCurrency, formatQuantity, formatDate } from '../../lib/utils';
import { ArrowLeft, User, Phone, MapPin, Sprout, MessageSquare, ReceiptText, ShieldCheck } from 'lucide-react';

export function AdminFarmerDetail() {
  const { id } = useParams();
  const { data: farmerData, isLoading: farmerLoading } = useFarmerDetail(id);
  const { data: advData } = useFarmerAdvisories(id);
  const { data: intentsData } = useFarmerSellIntents(id);

  const farmer = farmerData?.farmer;
  const advisories = advData?.advisories || [];
  const sellIntents = intentsData?.sellIntents || [];

  if (farmerLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading farmer profile...</div>;
  }

  if (!farmer) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Farmer #{id} not found.</p>
        <Link to="/admin/farmers" className="text-xs text-primary font-semibold">
          Return to Farmers Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb & Header */}
      <div>
        <Link
          to="/admin/farmers"
          className="inline-flex items-center text-xs font-semibold text-primary hover:text-agri-700 mb-2 gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Farmers Directory
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-agri-100 text-agri-800 font-bold text-lg border border-agri-200">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{farmer.name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{farmer.village}, {farmer.district} ({farmer.taluka})</span>
                <span>•</span>
                <span>Language: {farmer.preferredLanguage}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface border shadow-2xs">
              {farmer.landSizeAcres} Acres Holding
            </span>
          </div>
        </div>
      </div>

      {/* Tabs for Advisories & Sell Intent History */}
      <Tabs defaultValue="advisories" className="space-y-4">
        <TabsList className="bg-surface-muted border border-border">
          <TabsTrigger value="advisories" className="gap-2 text-xs font-semibold">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Advisory Delivery History ({advisories.length})</span>
          </TabsTrigger>
          <TabsTrigger value="intents" className="gap-2 text-xs font-semibold">
            <ReceiptText className="h-3.5 w-3.5" />
            <span>Sell Intents & Market Matches ({sellIntents.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Advisories */}
        <TabsContent value="advisories" className="space-y-4">
          {advisories.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-sm text-muted-foreground">No advisories generated yet for this farmer.</p>
            </Card>
          ) : (
            advisories.map((adv) => (
              <Card key={adv.id} className="border-border/80 bg-surface">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base text-foreground flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-primary" />
                      {adv.crop}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">{formatDate(adv.date)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed">
                  <div className="p-3 rounded-lg bg-surface-muted/60 border space-y-1">
                    <span className="font-bold text-foreground">Sowing & Agronomic Advice:</span>
                    <p className="text-muted-foreground">{adv.sowingRecommendation}</p>
                  </div>
                  {adv.pestWarning && (
                    <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-amber-900 space-y-1">
                      <span className="font-bold">Pest / Weather Alert:</span>
                      <p>{adv.pestWarning}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab 2: Sell Intents */}
        <TabsContent value="intents" className="space-y-4">
          {sellIntents.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-sm text-muted-foreground">No sell intents converted yet.</p>
            </Card>
          ) : (
            sellIntents.map((intent) => (
              <Card key={intent.id} className="border-border/80 bg-surface">
                <CardContent className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground text-sm">{intent.cropName}</h4>
                      <StatusBadge status={intent.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Volume: {formatQuantity(intent.quantityKg)} • Target Price: ₹{intent.agreedPricePerKg}/kg
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Matched Buyer: <strong className="text-foreground">{intent.buyerName}</strong>
                    </p>
                  </div>

                  <Link to={`/admin/transactions/${intent.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      View Transaction Audit
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
