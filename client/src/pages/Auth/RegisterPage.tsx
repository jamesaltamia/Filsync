import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { authService } from '../../services/authService';
import LogoImg from '../../assets/Filamer.png';
import BgImg from '../../assets/fcu-background.png';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier'>('cashier');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    // Enhanced password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      setError('Password must contain at least one special character.');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
      });

      // Show success message
      setSuccess('Account created successfully! Redirecting to login...');

      // Show custom modal with FilSync POS title
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0] ||
        'Registration failed. Please try again.';
      setError(errorMessage);
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
            className="w-15 h-15 object-contain mx-auto"
          />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FilSync POS</h1>
          <p className="text-gray-500">Create a new account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
          />

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
            placeholder="Min. 8 chars: uppercase, lowercase, number, symbol"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
          </p>

          <Input
            label="Confirm Password"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Confirm your password"
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'cashier')}
                  className="mr-2"
                />
                <span className="text-gray-700">Admin</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="cashier"
                  checked={role === 'cashier'}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'cashier')}
                  className="mr-2"
                />
                <span className="text-gray-700">Cashier</span>
              </label>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-6"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => navigate('/login')}
            >
              Sign in
            </span>
          </p>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/login');
        }}
        title="FilSync POS"
        size="sm"
      >
        <div className="text-center">
          <p className="mb-4 text-gray-700">
            Account has been successfully created! You will now be redirected to the login page.
          </p>
          <Button
            onClick={() => {
              setShowSuccessModal(false);
              navigate('/login');
            }}
            className="w-full"
          >
            OK
          </Button>
        </div>
      </Modal>
    </div>
  );
};

