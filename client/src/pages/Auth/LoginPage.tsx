import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import LogoImg from '../../assets/Filamer.png';
import BgImg from '../../assets/fcu-background.png';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-110 blur-sm"
        style={{ backgroundImage: `url(${BgImg})` }}
      />
      <div className="absolute inset-0 bg-black/50 z-10"></div>
      <div className="bg-white/95 backdrop-blur-sm border border-gray-300 rounded-xl shadow-2xl p-8 w-full max-w-md relative z-20">
        <div className="text-center mb-8">
          <img
            src={LogoImg}
            alt="Logo"
            className="w-16 h-16 object-contain mx-auto mb-2"
          />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">EnterpriseSync</h1>
          <p className="text-gray-500">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-6 text-lg py-2.5"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p
          className="mt-5 text-center text-gray-600 cursor-pointer hover:text-blue-600 underline text-sm font-medium"
          onClick={() => navigate('/forgot-password')}
        >
          Forgot password?
        </p>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-3 text-gray-400 text-sm font-mono tracking-widest">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="text-center">
          <Button
            className='bg-green-600 hover:bg-green-700 w-full text-lg py-2.5'
            onClick={() => navigate('/register')}
          >
            Create new account
          </Button>
        </div>
      </div>
    </div>
  );
};