import type { Metadata } from 'next';
import './globals.css';
import dynamic from 'next/dynamic';
import { Navigation } from '@/components/navigation';
import { GlobalFilterSidebar } from '@/components/global-filter-sidebar';
import { ThemeProvider } from '@/contexts/theme-context';
import { AttackSimulationProvider } from '@/contexts/attack-simulation-context';
import { FilterProvider } from '@/contexts/filter-context';

const ThreatTicker = dynamic(() => import('@/components/threat-ticker').then((mod) => ({ default: mod.ThreatTicker })), {
  ssr: false,
});

export const metadata: Metadata = {
  title: 'MedIoT Shield - Hospital IoT Security',
  description: 'Real-time security monitoring and threat detection for hospital IoT networks',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#0b0f1a] text-slate-100 antialiased">
        <ThemeProvider>
          <AttackSimulationProvider>
            <FilterProvider>
              <Navigation />
              <ThreatTicker />
              <GlobalFilterSidebar />
              {children}
            </FilterProvider>
          </AttackSimulationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
