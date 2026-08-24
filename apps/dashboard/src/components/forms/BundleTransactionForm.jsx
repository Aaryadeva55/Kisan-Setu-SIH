import { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { formatCurrency, formatQuantity } from '../../lib/utils';
import { Checkbox } from '@radix-ui/react-checkbox';
import { Check, Layers, Users, IndianRupee } from 'lucide-react';
import { SEED_FARMERS } from '../../mocks/seedData';

export function BundleTransactionForm({
  demand = [],
  onSubmit,
  loading = false,
}) {
  const [selectedRequirementId, setSelectedRequirementId] = useState(demand[0]?.id || 'req_001');
  const [selectedFarmerIds, setSelectedFarmerIds] = useState(['fm_001', 'fm_002']);

  const selectedRequirement = demand.find((d) => d.id === selectedRequirementId) || demand[0];

  // Available member farmers with simulated intent quantities
  const memberFarmers = useMemo(() => {
    return SEED_FARMERS.map((f, idx) => ({
      ...f,
      sellIntentQty: (idx + 1) * 750 + 500,
      expectedPrice: selectedRequirement?.maxPricePerKg || 50,
    }));
  }, [selectedRequirement]);

  const totalBundledQuantity = useMemo(() => {
    return memberFarmers
      .filter((f) => selectedFarmerIds.includes(f.id))
      .reduce((sum, f) => sum + f.sellIntentQty, 0);
  }, [memberFarmers, selectedFarmerIds]);

  const totalBundledValue = useMemo(() => {
    const price = selectedRequirement?.maxPricePerKg || 50;
    return totalBundledQuantity * price;
  }, [totalBundledQuantity, selectedRequirement]);

  const handleToggleFarmer = (farmerId) => {
    if (selectedFarmerIds.includes(farmerId)) {
      setSelectedFarmerIds(selectedFarmerIds.filter((id) => id !== farmerId));
    } else {
      setSelectedFarmerIds([...selectedFarmerIds, farmerId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFarmerIds.length === 0) return;
    onSubmit({
      buyerRequirementId: selectedRequirementId,
      sellIntentIds: selectedFarmerIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Select Target Buyer Demand */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs">
              1
            </span>
            Select Target Buyer Procurement Requirement
          </CardTitle>
          <CardDescription>
            Choose an active buyer requirement to aggregate farmer lots against.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {demand.map((req) => (
              <div
                key={req.id}
                onClick={() => setSelectedRequirementId(req.id)}
                className={`cursor-pointer rounded-lg border p-3.5 transition-all ${
                  selectedRequirementId === req.id
                    ? 'border-primary bg-agri-50/50 ring-2 ring-primary/20 shadow-xs'
                    : 'border-border hover:border-muted-foreground/40'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{req.cropName}</h4>
                    <p className="text-xs text-muted-foreground">{req.buyerName}</p>
                  </div>
                  <span className="text-xs font-bold text-primary">₹{req.maxPricePerKg}/kg</span>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground border-t pt-2">
                  <span>Target: {formatQuantity(req.quantityKg)}</span>
                  <span>Hub: {req.districtName}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Multi-select Member Farmers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs">
              2
            </span>
            Select Member Farmers to Aggregate into Bundle
          </CardTitle>
          <CardDescription>
            Combine smallholder member lots into a single institutional-grade supply lot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {memberFarmers.map((farmer) => {
            const isSelected = selectedFarmerIds.includes(farmer.id);
            return (
              <div
                key={farmer.id}
                onClick={() => handleToggleFarmer(farmer.id)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected ? 'border-primary/60 bg-agri-50/40' : 'border-border hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-primary border-primary text-white' : 'border-input bg-background'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{farmer.name}</div>
                    <div className="text-xs text-muted-foreground">{farmer.village}, {farmer.district}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">{formatQuantity(farmer.sellIntentQty)}</div>
                  <div className="text-xs text-muted-foreground">Lot Value: {formatCurrency(farmer.sellIntentQty * farmer.expectedPrice)}</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Step 3: Bundle Summary & Submit */}
      <Card className="border-primary/40 bg-agri-50/30">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aggregated Supply Lot Summary
              </span>
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{selectedFarmerIds.length} Farmers Bundled</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>{formatQuantity(totalBundledQuantity)} Total Lot</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
                  <IndianRupee className="h-4 w-4" />
                  <span>{formatCurrency(totalBundledValue)}</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={selectedFarmerIds.length === 0}
              loading={loading}
              className="bg-primary hover:bg-agri-700 text-white font-semibold px-6 shadow-md"
            >
              Create Bundle Transaction
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
