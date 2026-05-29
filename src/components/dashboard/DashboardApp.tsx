import '../../theme/tokens.css';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { AppShell } from '../layout/AppShell';
import { GamesDashboard } from './GamesDashboard';

export function DashboardApp() {
  return (
    <ThemeProvider>
      <AppShell active="home">
        <GamesDashboard />
      </AppShell>
    </ThemeProvider>
  );
}
