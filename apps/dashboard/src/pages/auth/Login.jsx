import { useState } from 'react';
import { LoginForm } from '../../components/forms/LoginForm';
import { useAuth } from '../../hooks/useAuth';

export function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in to Kisan Setu</h2>
        <p className="text-xs text-muted-foreground">
          Enter your authorized credentials to access your organization's dashboard.
        </p>
      </div>

      <LoginForm onSubmit={handleSubmit} loading={loading} error={error} />
    </div>
  );
}
