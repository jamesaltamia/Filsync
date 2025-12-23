import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { authService } from '../../services/authService';
import LogoImg from '../../assets/Filamer.png';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpFromServer, setOtpFromServer] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authService.forgotPassword({ email });
      setSuccess(response.message);
      setOtpFromServer(response.otp || null);
      setStep('reset');

      // Show OTP in development (remove in production)
      if (response.otp) {
        setSuccess(`Password reset code sent! (Dev mode: ${response.otp})`);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0] ||
        'Failed to send reset code. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({
        email,
        token: otp,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setSuccess('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0] ||
        'Failed to reset password. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="bg-blue-100 border border-gray-300 rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={LogoImg}
            alt="Logo"
            className="w-15 h-15 object-contain mx-auto"
          />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FilSync POS</h1>
          <p className="text-gray-500">
            {step === 'email' ? 'Reset your password' : 'Enter reset code'}
          </p>
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

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label="Reset Code (OTP)"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter the 6-digit code"
              required
              maxLength={6}
            />

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep('email');
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                setError('');
                setSuccess('');
              }}
            >
              Back to Email
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Remember your password?{' '}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => navigate('/login')}
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

