import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../schemas/auth.schema';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, UserCheck } from 'lucide-react';
import { SEED_USERS } from '../../mocks/seedData';

export function LoginForm({ onSubmit, loading = false, error }) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'buyer@sahyadri.com',
      password: 'password123',
    },
  });

  const setDemoUser = (userKey) => {
    const user = SEED_USERS[userKey];
    if (user) {
      setValue('email', user.email, { shouldValidate: true });
      setValue('password', 'password123', { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Credentials Quick Switch Strip */}
      <div className="rounded-xl border border-agri-200 bg-agri-50/70 p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-agri-900">
          <UserCheck className="h-4 w-4 text-primary" />
          <span>Demo Role Fast-Login (SIH Judging Presets):</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setDemoUser('buyer')}
            className="rounded-lg border border-agri-200 bg-white px-2 py-1.5 text-[11px] font-medium text-agri-900 hover:bg-agri-100/60 transition-colors shadow-2xs text-center"
          >
            🛒 Buyer (Sahyadri)
          </button>
          <button
            type="button"
            onClick={() => setDemoUser('admin')}
            className="rounded-lg border border-agri-200 bg-white px-2 py-1.5 text-[11px] font-medium text-agri-900 hover:bg-agri-100/60 transition-colors shadow-2xs text-center"
          >
            🏛️ Admin (Maha Agri)
          </button>
          <button
            type="button"
            onClick={() => setDemoUser('fpo')}
            className="rounded-lg border border-agri-200 bg-white px-2 py-1.5 text-[11px] font-medium text-agri-900 hover:bg-agri-100/60 transition-colors shadow-2xs text-center"
          >
            🌾 FPO (Godavari)
          </button>
          <button
            type="button"
            onClick={() => setDemoUser('evaluator')}
            className="rounded-lg border border-agri-200 bg-white px-2 py-1.5 text-[11px] font-medium text-agri-900 hover:bg-agri-100/60 transition-colors shadow-2xs text-center"
          >
            📊 Evaluator (NITI)
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="e.g. buyer@sahyadri.com"
              className="pl-9"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pl-9 pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-agri-700 text-white font-semibold h-11 text-base shadow-md"
          loading={loading}
        >
          Sign in to Dashboard
        </Button>
      </form>
    </div>
  );
}
