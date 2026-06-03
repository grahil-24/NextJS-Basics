import '@/styles/global.css';
import {inter} from '@/ui/fonts';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Acme dashboard',
    default: 'Acme dashboard'
  },
  description: 'Official Acme dashboard, built with app router',
  metadataBase: new URL("https://next-js-basics-six.vercel.app")
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
