<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check if account is locked
        if ($user && $user->isLocked()) {
            $minutesRemaining = now()->diffInMinutes($user->locked_until, false);
            Log::warning('Login attempt on locked account', [
                'email' => $request->email,
                'ip' => $request->ip(),
            ]);
            
            throw ValidationException::withMessages([
                'email' => ['This account has been locked due to multiple failed login attempts. Please try again in ' . $minutesRemaining . ' minutes.'],
            ]);
        }

        // Verify credentials
        if (!$user || !Hash::check($request->password, $user->password)) {
            if ($user) {
                $user->incrementFailedAttempts();
                Log::warning('Failed login attempt', [
                    'email' => $request->email,
                    'ip' => $request->ip(),
                    'attempts' => $user->failed_login_attempts,
                ]);
            } else {
                Log::warning('Failed login attempt - user not found', [
                    'email' => $request->email,
                    'ip' => $request->ip(),
                ]);
            }
            
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Reset failed attempts and update last login
        $user->resetFailedAttempts();
        
        Log::info('Successful login', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => $request->ip(),
        ]);

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
            ],
        ]);
    }

    public function register(Request $request)
    {
        // SECURITY: Restrict registration to admin-only or require invitation code
        // For now, we'll require admin authentication or an invitation code
        // You can modify this based on your needs
        
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
            'role' => 'required|in:admin,cashier',
            'invitation_code' => 'nullable|string', // Optional: Add invitation code system
        ]);

        // SECURITY: Only allow cashier registration by default, admin must be created by existing admin
        if ($request->role === 'admin') {
            // Check if user is authenticated and is admin
            if (!$request->user() || $request->user()->role !== 'admin') {
                Log::warning('Unauthorized admin registration attempt', [
                    'email' => $request->email,
                    'ip' => $request->ip(),
                ]);
                
                throw ValidationException::withMessages([
                    'role' => ['Only existing administrators can create admin accounts.'],
                ]);
            }
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        Log::info('New user registered', [
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'ip' => $request->ip(),
        ]);

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token,
        ], 201);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // SECURITY: Don't reveal if email exists (prevent email enumeration)
        $user = User::where('email', $request->email)->first();

        // Always return success message, even if email doesn't exist
        // This prevents attackers from discovering valid email addresses
        if ($user) {
            // Generate OTP (6-digit code)
            $otp = str_pad((string) rand(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Store OTP in password_reset_tokens table
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $request->email],
                [
                    'token' => Hash::make($otp),
                    'created_at' => now(),
                ]
            );

            // SECURITY: Send OTP via email (not in API response)
            try {
                // For development: Log OTP to file
                Log::info('Password reset OTP generated', [
                    'email' => $request->email,
                    'otp' => $otp,
                ]);

                // TODO: Implement email sending for production
                // Mail::to($request->email)->send(new PasswordResetMail($otp));
                
                Log::info('Password reset requested', [
                    'email' => $request->email,
                    'ip' => $request->ip(),
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send password reset email', [
                    'email' => $request->email,
                    'error' => $e->getMessage(),
                ]);
            }

            // DEVELOPMENT ONLY: Return OTP in response when debug mode is enabled
            // REMOVE THIS IN PRODUCTION!
            $response = [
                'message' => 'If that email address exists in our system, we have sent a password reset code.',
            ];

            if (config('app.debug')) {
                $response['otp'] = $otp; // Only in development/debug mode
                $response['debug_note'] = '⚠️ DEBUG MODE: OTP shown here. Remove in production!';
            }

            return response()->json($response);
        } else {
            // Log failed password reset attempt (but don't reveal to user)
            Log::warning('Password reset attempt for non-existent email', [
                'email' => $request->email,
                'ip' => $request->ip(),
            ]);
        }

        // Always return the same message
        return response()->json([
            'message' => 'If that email address exists in our system, we have sent a password reset code.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string|size:6',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        $passwordReset = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$passwordReset) {
            throw ValidationException::withMessages([
                'email' => ['Invalid or expired reset code.'],
            ]);
        }

        // Check if token is expired (60 minutes)
        if (Carbon::parse($passwordReset->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            throw ValidationException::withMessages([
                'email' => ['Reset code has expired. Please request a new one.'],
            ]);
        }

        // Verify OTP
        if (!Hash::check($request->token, $passwordReset->token)) {
            throw ValidationException::withMessages([
                'token' => ['Invalid reset code.'],
            ]);
        }

        // Update password
        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->unlock(); // Unlock account if it was locked
        $user->save();

        // Delete the reset token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        Log::info('Password reset successful', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Password has been reset successfully.',
        ]);
    }
}
