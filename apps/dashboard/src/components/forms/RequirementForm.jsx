import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requirementSchema } from '../../schemas/requirement.schema';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SEED_CROPS, SEED_DISTRICTS } from '../../mocks/seedData';
import { Card, CardContent } from '../ui/card';
import { Sprout, MapPin, Calendar, Scale, Award } from 'lucide-react';

export function RequirementForm({
  initialData,
  onSubmit,
  loading = false,
  submitLabel = 'Post Requirement',
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(requirementSchema),
    defaultValues: initialData || {
      cropId: 'crop_soy',
      quantityKg: 10000,
      maxPricePerKg: 52,
      minQualityGrade: 'A',
      districtId: 'dist_nsk',
      radiusKm: 50,
      neededByDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Crop Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sprout className="h-3.5 w-3.5 text-primary" />
              Target Crop Required *
            </label>
            <select
              className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('cropId')}
            >
              {SEED_CROPS.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name} ({crop.hindiName}) — Modal: ₹{crop.modalPrice}/Qtl
                </option>
              ))}
            </select>
            {errors.cropId && <p className="text-xs text-destructive">{errors.cropId.message}</p>}
          </div>

          {/* Quantity & Max Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-primary" />
                Procurement Target (in Kilograms) *
              </label>
              <Input type="number" placeholder="e.g. 25000" {...register('quantityKg')} />
              {errors.quantityKg && <p className="text-xs text-destructive">{errors.quantityKg.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Max Acceptable Price (₹ / kg) (Optional)
              </label>
              <Input type="number" step="0.5" placeholder="e.g. 52.00" {...register('maxPricePerKg')} />
              {errors.maxPricePerKg && <p className="text-xs text-destructive">{errors.maxPricePerKg.message}</p>}
            </div>
          </div>

          {/* Quality Grade & Needed-by Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-primary" />
                Minimum Quality Grade Required *
              </label>
              <select
                className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                {...register('minQualityGrade')}
              >
                <option value="A">Grade A (Premium Assayed / Low Moisture)</option>
                <option value="B">Grade B (Standard Commercial)</option>
                <option value="C">Grade C (Fair Average Quality)</option>
                <option value="ANY">Any Grade Acceptable</option>
              </select>
              {errors.minQualityGrade && <p className="text-xs text-destructive">{errors.minQualityGrade.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Needed by Delivery Date *
              </label>
              <Input type="date" {...register('neededByDate')} />
              {errors.neededByDate && <p className="text-xs text-destructive">{errors.neededByDate.message}</p>}
            </div>
          </div>

          {/* District & Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Procurement Hub District *
              </label>
              <select
                className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                {...register('districtId')}
              >
                {SEED_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}, {d.state}
                  </option>
                ))}
              </select>
              {errors.districtId && <p className="text-xs text-destructive">{errors.districtId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Search Radius from Hub (km) *
              </label>
              <Input type="number" min="10" max="500" placeholder="e.g. 50" {...register('radiusKm')} />
              {errors.radiusKm && <p className="text-xs text-destructive">{errors.radiusKm.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          className="bg-primary hover:bg-agri-700 text-white font-semibold px-6 shadow-md"
          loading={loading}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
