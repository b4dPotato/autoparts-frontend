import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Tracking Admin | AutoParts Ukraine',
  robots: {index: false, follow: false}
};

export default function AdminRootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
