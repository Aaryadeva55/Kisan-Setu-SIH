import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth.api';
import { useNavigate } from 'react-router-dom';
import { ROLE_HOME_ROUTES } from '../constants/roles';
import { toast } from 'sonner';

export function useAuth() {
  const { user, accessToken, isAuthenticated, isHydrated, setSession, clear } = useAuthStore();
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      const data = await authApi.login({ email, password });
      setSession(data.user, data.accessToken);
      toast.success(`Welcome back, ${data.user.name}`);
      const homeRoute = ROLE_HOME_ROUTES[data.user.role] || '/buyer/dashboard';
      navigate(homeRoute);
      return data.user;
    } catch (err) {
      toast.error(err.message || 'Invalid email or password');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout().catch(() => {});
    } finally {
      clear();
      toast.info('You have been logged out');
      navigate('/login');
    }
  };

  return {
    user,
    accessToken,
    isAuthenticated,
    isHydrated,
    login,
    logout,
  };
}
