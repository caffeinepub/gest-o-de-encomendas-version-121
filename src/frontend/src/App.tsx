import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import OrderManagement from './components/OrderManagement';
import MaterialPricesManagement from './components/MaterialPricesManagement';
import PriceTablesManagement from './components/PriceTablesManagement';
import BackupDialog from './components/BackupDialog';
import SyncDialog from './components/SyncDialog';
import { Button } from '@/components/ui/button';
import { Package, LogOut, User, Database, Table, RefreshCw } from 'lucide-react';

const queryClient = new QueryClient();

function AppContent() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const [activeTab, setActiveTab] = useState<string>('orcamentos');
  const [currentView, setCurrentView] = useState<'orders' | 'materials' | 'priceTables'>('orders');
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleBackToOrders = () => {
    setCurrentView('orders');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Sistema de Gestão de Encomendas
            </h1>
            <p className="text-muted-foreground text-lg">
              Gerencie suas encomendas, orçamentos e materiais
            </p>
          </div>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            size="lg"
            className="px-8"
          >
            {isLoggingIn ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                A autenticar...
              </>
            ) : (
              <>
                <User className="h-5 w-5 mr-2" />
                Entrar com Internet Identity
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <BackupDialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen} />
      <SyncDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen} />
      
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img 
                src="/assets/simbol.jpg" 
                alt="Logo da empresa" 
                className="h-16 w-16 object-contain rounded-lg shadow-sm"
              />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground">
                    Gestão de Encomendas
                  </h1>
                  <Button
                    variant={currentView === 'materials' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentView('materials')}
                    className="text-sm"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Materiais
                  </Button>
                  <Button
                    variant={currentView === 'priceTables' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentView('priceTables')}
                    className="text-sm"
                  >
                    <Table className="h-4 w-4 mr-2" />
                    Tabelas de Preço
                  </Button>
                </div>
                <p className="text-muted-foreground mt-2">
                  {currentView === 'orders' 
                    ? 'Acompanhe o processo de todas as suas encomendas'
                    : currentView === 'materials'
                    ? 'Gerir materiais e preços de múltiplos fornecedores'
                    : 'Gerir tabelas de preço por categoria'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSyncDialogOpen(true)}
                className="text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBackupDialogOpen(true)}
                className="text-sm"
              >
                <Database className="h-4 w-4 mr-2" />
                Criar Backup
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          {currentView === 'orders' ? (
            <OrderManagement activeTab={activeTab} onTabChange={setActiveTab} />
          ) : currentView === 'materials' ? (
            <MaterialPricesManagement onBack={handleBackToOrders} />
          ) : (
            <PriceTablesManagement onBack={handleBackToOrders} />
          )}
        </main>
        
        <footer className="border-t bg-card mt-16">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            © 2025. Built with ❤️ using{' '}
            <a 
              href="https://caffeine.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
