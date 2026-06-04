import AcmeLogo from '@/ui/acme-logo';
import SignupForm from '@/ui/signup-form';
import { Metadata } from 'next';
import { Suspense } from 'react';
 
export const metadata: Metadata = {
    title: 'Sign up'
}

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <Suspense>
          <SignupForm />
      </Suspense>
    </main>
  );
}