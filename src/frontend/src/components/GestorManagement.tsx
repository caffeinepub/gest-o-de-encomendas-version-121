import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, User, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useOrderQueries } from '../hooks/useQueries';
import { toast } from 'sonner';

interface GestorManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GestorManagement({ open, onOpenChange }: GestorManagementProps) {
  const [newGestorName, setNewGestorName] = useState('');
  const [isAddingGestor, setIsAddingGestor] = useState(false);
  
  const { useGestores, useAddGestor } = useOrderQueries();
  const gestores = useGestores();
  const addGestorMutation = useAddGestor();

  const handleAddGestor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGestorName.trim()) {
      toast.error('Nome do gestor é obrigatório');
      return;
    }

    // Check if gestor already exists
    const gestorExists = gestores.data?.some(g => g.nome.toLowerCase() === newGestorName.trim().toLowerCase());
    if (gestorExists) {
      toast.error('Gestor já existe');
      return;
    }

    try {
      await addGestorMutation.mutateAsync(newGestorName.trim());
      toast.success('Gestor adicionado com sucesso!');
      setNewGestorName('');
      setIsAddingGestor(false);
    } catch (error) {
      toast.error('Erro ao adicionar gestor');
      console.error('Error adding gestor:', error);
    }
  };

  const handleClose = () => {
    setIsAddingGestor(false);
    setNewGestorName('');
    onOpenChange(false);
  };

  const hasGestores = gestores.data && gestores.data.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestão de Gestores
          </DialogTitle>
          <DialogDescription>
            Adicione ou gerencie os gestores responsáveis pelas encomendas. É necessário ter pelo menos um gestor para criar encomendas.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Alert */}
          {!gestores.isLoading && (
            hasGestores ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Sistema pronto! Você tem {gestores.data.length} {gestores.data.length === 1 ? 'gestor cadastrado' : 'gestores cadastrados'} e pode criar encomendas.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Adicione pelo menos um gestor para poder criar encomendas no sistema.
                </AlertDescription>
              </Alert>
            )
          )}

          {/* Current Gestores */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Gestores Cadastrados</h3>
              <Badge variant={hasGestores ? "default" : "secondary"}>
                {gestores.data?.length || 0} {(gestores.data?.length || 0) === 1 ? 'gestor' : 'gestores'}
              </Badge>
            </div>
            
            {gestores.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(2)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : !hasGestores ? (
              <Card className="text-center py-8 border-dashed">
                <CardContent>
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Nenhum gestor cadastrado</h4>
                  <p className="text-muted-foreground mb-4">
                    Adicione o primeiro gestor para começar a usar o sistema
                  </p>
                  <Button onClick={() => setIsAddingGestor(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Gestor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gestores.data?.map((gestor) => (
                  <Card key={gestor.nome} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        {gestor.nome}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add New Gestor */}
          {!isAddingGestor ? (
            <div className="flex justify-center">
              <Button 
                onClick={() => setIsAddingGestor(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar {hasGestores ? 'Novo' : 'Primeiro'} Gestor
              </Button>
            </div>
          ) : (
            <Card className="border-dashed border-primary/50">
              <CardHeader>
                <CardTitle className="text-base">Adicionar Novo Gestor</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddGestor} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gestorName">Nome do Gestor</Label>
                    <Input
                      id="gestorName"
                      value={newGestorName}
                      onChange={(e) => setNewGestorName(e.target.value)}
                      placeholder="Digite o nome do gestor"
                      disabled={addGestorMutation.isPending}
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit"
                      disabled={addGestorMutation.isPending || !newGestorName.trim()}
                      size="sm"
                    >
                      {addGestorMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Adicionar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingGestor(false);
                        setNewGestorName('');
                      }}
                      disabled={addGestorMutation.isPending}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={addGestorMutation.isPending}
          >
            {hasGestores ? 'Fechar' : 'Fechar (Adicione gestores primeiro)'}
          </Button>
          {hasGestores && (
            <Button
              type="button"
              onClick={handleClose}
              disabled={addGestorMutation.isPending}
            >
              Concluído
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
