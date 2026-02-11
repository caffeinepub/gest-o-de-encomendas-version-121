import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Building2, FileText } from 'lucide-react';
import { useEmpresaQueries, useRodapeQueries } from '../hooks/useQueries';
import { toast } from 'sonner';

interface EmpresaSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmpresaSettingsDialog({ open, onOpenChange }: EmpresaSettingsDialogProps) {
  // Empresa fields
  const [nome, setNome] = useState('');
  const [morada, setMorada] = useState('');
  const [nib, setNib] = useState('');
  const [cae, setCae] = useState('');
  const [alvara, setAlvara] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  // Rodape field
  const [rodapeTextoCompleto, setRodapeTextoCompleto] = useState('');

  const { useEmpresa, useSaveEmpresa, useUpdateEmpresa } = useEmpresaQueries();
  const { useRodape, useSaveRodape, useUpdateRodape } = useRodapeQueries();
  
  const empresa = useEmpresa();
  const rodape = useRodape();
  
  const saveEmpresaMutation = useSaveEmpresa();
  const updateEmpresaMutation = useUpdateEmpresa();
  const saveRodapeMutation = useSaveRodape();
  const updateRodapeMutation = useUpdateRodape();

  useEffect(() => {
    if (empresa.data && open) {
      setNome(empresa.data.nome);
      setMorada(empresa.data.morada);
      setNib(empresa.data.nib);
      setCae(empresa.data.cae);
      setAlvara(empresa.data.alvara);
      setTelefone(empresa.data.telefone);
      setEmail(empresa.data.email);
    }
  }, [empresa.data, open]);

  useEffect(() => {
    if (rodape.data && open) {
      setRodapeTextoCompleto(rodape.data.textoCompleto);
    }
  }, [rodape.data, open]);

  const handleSubmitEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    try {
      const empresaData = {
        nome: nome.trim(),
        morada: morada.trim(),
        nib: nib.trim(),
        cae: cae.trim(),
        alvara: alvara.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        logoPath: '/assets/simbol.jpg'
      };

      if (empresa.data) {
        await updateEmpresaMutation.mutateAsync(empresaData);
        toast.success('Informações da empresa atualizadas com sucesso!');
      } else {
        await saveEmpresaMutation.mutateAsync(empresaData);
        toast.success('Informações da empresa salvas com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao salvar informações da empresa');
      console.error('Error saving empresa:', error);
    }
  };

  const handleSubmitRodape = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const textoCompleto = rodapeTextoCompleto.trim();

      if (rodape.data) {
        await updateRodapeMutation.mutateAsync(textoCompleto);
        toast.success('Informações do rodapé atualizadas com sucesso!');
      } else {
        await saveRodapeMutation.mutateAsync(textoCompleto);
        toast.success('Informações do rodapé salvas com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao salvar informações do rodapé');
      console.error('Error saving rodape:', error);
    }
  };

  const isLoadingEmpresa = saveEmpresaMutation.isPending || updateEmpresaMutation.isPending;
  const isLoadingRodape = saveRodapeMutation.isPending || updateRodapeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Configurações da Empresa
          </DialogTitle>
          <DialogDescription>
            Configure as informações da sua empresa e do rodapé dos orçamentos
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="empresa" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="empresa" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Dados da Empresa
            </TabsTrigger>
            <TabsTrigger value="rodape" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Rodapé dos Orçamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="mt-6">
            <form onSubmit={handleSubmitEmpresa} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="nome">Nome da Empresa *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome completo da empresa"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="morada">Morada</Label>
                  <Input
                    id="morada"
                    value={morada}
                    onChange={(e) => setMorada(e.target.value)}
                    placeholder="Endereço completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nib">NIB</Label>
                  <Input
                    id="nib"
                    value={nib}
                    onChange={(e) => setNib(e.target.value)}
                    placeholder="Número de Identificação Bancária"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cae">CAE</Label>
                  <Input
                    id="cae"
                    value={cae}
                    onChange={(e) => setCae(e.target.value)}
                    placeholder="Classificação das Atividades Económicas"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alvara">Alvará</Label>
                  <Input
                    id="alvara"
                    value={alvara}
                    onChange={(e) => setAlvara(e.target.value)}
                    placeholder="Número do alvará"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="Telefone de contato"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email de contato"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoadingEmpresa}>
                  {isLoadingEmpresa && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {empresa.data ? 'Atualizar' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="rodape" className="mt-6">
            <form onSubmit={handleSubmitRodape} className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure as informações que aparecerão no rodapé dos orçamentos em PDF. 
                  Insira o texto completo exatamente como deseja que apareça, incluindo IBANs, contatos, redes sociais e outros detalhes.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="rodapeTextoCompleto">Texto Completo do Rodapé</Label>
                  <Textarea
                    id="rodapeTextoCompleto"
                    value={rodapeTextoCompleto}
                    onChange={(e) => setRodapeTextoCompleto(e.target.value)}
                    placeholder="Exemplo:&#10;mg.lda@hotmail.com | www.marcenariagoncalves.pt | www.facebook.com/ldamarcenariagoncalves | www.instagram.com/mg.lda&#10;Sociedade por Quotas * Capital Social 74.819,00 € * Matrícula Nº 201 da Conservatória do Registo Comercial de Arouca * Alvará nº 89873 * Contribuinte Nº 501791809&#10;&#10;IBAN BCP: PT50.0033.0000.04283719537.81 | SWIFT/BIC: BCOMPTPL&#10;IBAN SANTANDER: PT50.0018.0000.06048112001.60 | SWIFT/BIC: TOTAPTPL"
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dica: Use quebras de linha para organizar as informações em múltiplas linhas
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoadingRodape}>
                  {isLoadingRodape && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {rodape.data ? 'Atualizar Rodapé' : 'Salvar Rodapé'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
