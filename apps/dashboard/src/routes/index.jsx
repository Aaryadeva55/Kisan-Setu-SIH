import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Public Pages
import { Landing } from '../pages/landing/Landing';
import { Login } from '../pages/auth/Login';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { Unauthorized } from '../pages/errors/Unauthorized';
import { NotFound } from '../pages/errors/NotFound';

// Buyer Pages
import { BuyerDashboard } from '../pages/buyer/BuyerDashboard';
import { BuyerRequirements } from '../pages/buyer/BuyerRequirements';
import { BuyerRequirementNew } from '../pages/buyer/BuyerRequirementNew';
import { BuyerRequirementEdit } from '../pages/buyer/BuyerRequirementEdit';
import { BuyerRequests } from '../pages/buyer/BuyerRequests';
import { BuyerTransactions } from '../pages/buyer/BuyerTransactions';
import { BuyerTransactionDetail } from '../pages/buyer/BuyerTransactionDetail';
import { BuyerProfile } from '../pages/buyer/BuyerProfile';

// Admin / Government Evaluator Pages
import { AdminOverview } from '../pages/admin/AdminOverview';
import { AdminFarmers } from '../pages/admin/AdminFarmers';
import { AdminFarmerDetail } from '../pages/admin/AdminFarmerDetail';
import { AdminBuyers } from '../pages/admin/AdminBuyers';
import { AdminFpos } from '../pages/admin/AdminFpos';
import { AdminFpoDetail } from '../pages/admin/AdminFpoDetail';
import { AdminCrops } from '../pages/admin/AdminCrops';
import { AdminMarketPrices } from '../pages/admin/AdminMarketPrices';
import { AdminWeather } from '../pages/admin/AdminWeather';
import { AdminRecommendations } from '../pages/admin/AdminRecommendations';
import { AdminTransactions } from '../pages/admin/AdminTransactions';
import { AdminTransactionDetail } from '../pages/admin/AdminTransactionDetail';
import { AdminAnalytics } from '../pages/admin/AdminAnalytics';
import { AdminSystemHealth } from '../pages/admin/AdminSystemHealth';

// FPO Pages
import { FpoDashboard } from '../pages/fpo/FpoDashboard';
import { FpoFarmers } from '../pages/fpo/FpoFarmers';
import { FpoDemand } from '../pages/fpo/FpoDemand';
import { FpoBundle } from '../pages/fpo/FpoBundle';
import { FpoTransactions } from '../pages/fpo/FpoTransactions';
import { FpoProfile } from '../pages/fpo/FpoProfile';

export function AppRoutes() {
  return (
    <Routes>
      {/* ── Public Landing ── */}
      <Route path="/" element={<Landing />} />

      {/* ── Auth Layout ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<NotFound />} />
      </Route>

      {/* ── Buyer Portal ── */}
      <Route
        path="/buyer"
        element={
          <ProtectedRoute allowedRoles={['BUYER']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/buyer/dashboard" replace />} />
        <Route path="dashboard" element={<BuyerDashboard />} />
        <Route path="requirements" element={<BuyerRequirements />} />
        <Route path="requirements/new" element={<BuyerRequirementNew />} />
        <Route path="requirements/:id/edit" element={<BuyerRequirementEdit />} />
        <Route path="requests" element={<BuyerRequests />} />
        <Route path="transactions" element={<BuyerTransactions />} />
        <Route path="transactions/:id" element={<BuyerTransactionDetail />} />
        <Route path="profile" element={<BuyerProfile />} />
      </Route>

      {/* ── FPO Portal ── */}
      <Route
        path="/fpo"
        element={
          <ProtectedRoute allowedRoles={['FPO']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/fpo/dashboard" replace />} />
        <Route path="dashboard" element={<FpoDashboard />} />
        <Route path="farmers" element={<FpoFarmers />} />
        <Route path="demand" element={<FpoDemand />} />
        <Route path="bundle" element={<FpoBundle />} />
        <Route path="transactions" element={<FpoTransactions />} />
        <Route path="profile" element={<FpoProfile />} />
      </Route>

      {/* ── Admin / Government Evaluator Portal ── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'GOVERNMENT_EVALUATOR']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/overview" replace />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="farmers" element={<AdminFarmers />} />
        <Route path="farmers/:id" element={<AdminFarmerDetail />} />
        <Route path="buyers" element={<AdminBuyers />} />
        <Route path="fpos" element={<AdminFpos />} />
        <Route path="fpos/:id" element={<AdminFpoDetail />} />
        <Route path="crops" element={<AdminCrops />} />
        <Route path="market-prices" element={<AdminMarketPrices />} />
        <Route path="weather" element={<AdminWeather />} />
        <Route path="recommendations" element={<AdminRecommendations />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="transactions/:id" element={<AdminTransactionDetail />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="system-health" element={<AdminSystemHealth />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
