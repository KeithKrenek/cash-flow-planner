import type { ReactNode } from 'react';
import { Header } from './Header';
import { Container } from './Container';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
