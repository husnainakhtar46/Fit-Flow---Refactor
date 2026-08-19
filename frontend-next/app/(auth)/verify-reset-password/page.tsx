'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useResetPassword } from '@/hooks/usePasswordReset';

function VerifyResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const isEmailReadonly = !!emailParam;
  const resetPassword = useResetPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (otpCode.length !== 6) {
      toast.error('Please enter the 6-digit authorization code');
      return;
    }

    resetPassword.mutate(
      { email, otpCode, newPassword },
      {
        onSuccess: () => {
          toast.success('Password successfully reset! You can now log in.');
          router.push('/login');
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.error ||
            'Failed to reset password. Please check your code and try again.';
          toast.error(errorMessage);
        },
      }
    );
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-2 pb-6 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
          Set New Password
        </CardTitle>
        <CardDescription className="text-gray-500 text-sm">
          Enter the 6-digit code sent to your email along with your new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 w-full ${isEmailReadonly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
              readOnly={isEmailReadonly}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="otpCode" className="text-sm font-medium text-gray-700">
              6-Digit Code
            </Label>
            <Input
              id="otpCode"
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="h-12 w-full tracking-widest text-center text-lg placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 w-full focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 w-full focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 mt-2 text-md font-medium shadow-sm hover:shadow-md bg-blue-600 hover:bg-blue-700 text-white"
            disabled={resetPassword.isPending}
          >
            {resetPassword.isPending ? 'Resetting Password...' : 'Reset Password'}
          </Button>

          <div className="pt-2 text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Didn&apos;t receive code? Try again
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Suspense
        fallback={
          <div className="flex h-40 items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <VerifyResetPasswordForm />
      </Suspense>
    </div>
  );
}
