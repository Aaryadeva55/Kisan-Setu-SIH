import { useState } from 'react';
import { useFarmers } from '../../hooks/useFarmers';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Sparkles, Sprout, CheckCircle2, User, Phone, MapPin } from 'lucide-react';
import { MatchScoreBadge } from '../../components/common/MatchScoreBadge';

export function AdminRecommendations() {
  const { data: farmersData } = useFarmers();
  const farmers = farmersData?.farmers || [];
  const [selectedFarmerId, setSelectedFarmerId] = useState(farmers[0]?.id || 'fm_001');

  const selectedFarmer = farmers.find((f) => f.id === selectedFarmerId) || farmers[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Explainable Advisory Engine</h2>
        <p className="text-xs text-muted-foreground">
          Rule-based crop recommendation validator • Inspect the deterministic agronomic logic dispatched to farmers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Farmer Selector Column */}
        <div className="md:col-span-5 space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Farmer to Inspect
          </label>
          <div className="space-y-2">
            {farmers.map((farmer) => (
              <div
                key={farmer.id}
                onClick={() => setSelectedFarmerId(farmer.id)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  selectedFarmerId === farmer.id
                    ? 'border-primary bg-agri-50/60 ring-2 ring-primary/20 shadow-xs'
                    : 'border-border bg-surface hover:border-muted-foreground/40'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm text-foreground">{farmer.name}</div>
                  <span className="text-xs text-muted-foreground">{farmer.landSizeAcres} Ac</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{farmer.village}, {farmer.district}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advisory Explanation Column */}
        <div className="md:col-span-7 space-y-4">
          <Card className="border-primary/40 bg-surface">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-secondary" />
                    Latest Advisory Recommendation
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dispatched via WhatsApp in Marathi (मराठी)
                  </p>
                </div>
                <MatchScoreBadge score={92} size="lg" />
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Farmer Summary */}
              <div className="p-3 rounded-lg bg-surface-muted/60 text-xs space-y-1">
                <span className="font-semibold text-foreground">Target Recipient:</span>
                <p className="text-muted-foreground">
                  {selectedFarmer?.name} ({selectedFarmer?.phone}) • {selectedFarmer?.village}, {selectedFarmer?.district}
                </p>
              </div>

              {/* Recommended Crop */}
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Primary Crop Recommendation
                </span>
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <Sprout className="h-6 w-6" />
                  Soybean (JS 335)
                </h3>
              </div>

              {/* Deterministic Rule Rationale */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rule-Based Engine Deterministic Rationale
                </span>
                <div className="space-y-2 text-xs text-foreground leading-relaxed bg-agri-50/50 p-3.5 rounded-lg border border-agri-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Rainfall Threshold:</strong> 78mm cumulative rainfall recorded in Niphad cluster, satisfying minimum sowing threshold for medium-duration legumes.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Soil Profile Match:</strong> Medium black soil (Vertisol) suitable for nodulation without excess water stagnation.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Market Linkage Demand:</strong> 3 institutional buyers within 50km radius actively seeking 25,000+ kg lots at ₹50+/kg.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
