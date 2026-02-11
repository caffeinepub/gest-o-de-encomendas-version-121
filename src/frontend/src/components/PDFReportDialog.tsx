import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Status, type RelatorioPDF } from '../backend';
import { useOrderQueries } from '../hooks/useQueries';
import { toast } from 'sonner';

interface PDFReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions = [
  { value: Status.encomenda, label: 'Encomendas' },
  { value: Status.producao, label: 'Em Produção' },
  { value: Status.montagem, label: 'Em Montagem em Obra' },
  { value: Status.porPagar, label: 'Por Pagar' },
  { value: Status.concluido, label: 'Concluído' }
];

export default function PDFReportDialog({ open, onOpenChange }: PDFReportDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<Status | ''>('');
  const [selectedGestor, setSelectedGestor] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const { useGestores, useGeneratePDFReport } = useOrderQueries();
  const gestores = useGestores();
  const generatePDFMutation = useGeneratePDFReport();

  const formatCurrency = (value: bigint) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(value) / 100);
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('pt-PT');
  };

  const generatePDF = async () => {
    if (!selectedStatus) {
      toast.error('Selecione um status para gerar o relatório');
      return;
    }

    setIsGenerating(true);

    try {
      // Get the data from the backend using the mutation
      const reportResponse = await generatePDFMutation.mutateAsync({
        status: selectedStatus,
        gestorFilter: selectedGestor === 'all' ? null : selectedGestor
      });

      if (!reportResponse || !reportResponse.relatorios || reportResponse.relatorios.length === 0) {
        toast.error('Nenhuma encomenda encontrada para os filtros especificados');
        setIsGenerating(false);
        return;
      }

      // Generate PDF content with grouped data
      const pdfContent = generatePDFContent(reportResponse.relatorios, reportResponse.resumoFinanceiro);
      
      // Create and download the PDF
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link to download
      const link = document.createElement('a');
      link.href = url;
      
      const statusLabel = statusOptions.find(s => s.value === selectedStatus)?.label || 'Relatório';
      const gestorLabel = selectedGestor === 'all' ? 'Todos_os_Gestores' : selectedGestor.replace(/\s+/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      
      link.download = `Relatorio_${statusLabel.replace(/\s+/g, '_')}_${gestorLabel}_${dateStr}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Relatório PDF gerado com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      if (error instanceof Error && error.message.includes('Nenhuma encomenda encontrada')) {
        toast.error('Nenhuma encomenda encontrada para os filtros especificados');
      } else {
        toast.error('Erro ao gerar relatório PDF');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDFContent = (reportData: RelatorioPDF[], resumoFinanceiro: { totalEncomendas: bigint; totalValor: bigint; totalAdiantado: bigint; totalPendente: bigint }) => {
    const statusLabel = statusOptions.find(s => s.value === selectedStatus)?.label || 'Relatório';
    const gestorLabel = selectedGestor === 'all' ? 'Todos os Gestores' : selectedGestor;
    const currentDate = new Date().toLocaleDateString('pt-PT');
    
    // Use the resumoFinanceiro from backend instead of calculating manually
    const totalValue = resumoFinanceiro.totalValor;
    const totalAdvanced = resumoFinanceiro.totalAdiantado;
    const totalOrders = Number(resumoFinanceiro.totalEncomendas);

    // Generate content grouped by gestor
    const gestorSections = reportData.map(gestorData => {
      const gestorTotalValue = gestorData.encomendas.reduce((sum, order) => sum + order.valorTotal, BigInt(0));
      const gestorTotalAdvanced = gestorData.encomendas.reduce((sum, order) => sum + order.valorAdiantado, BigInt(0));
      
      const orderRows = gestorData.encomendas.map(order => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">#${order.id}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${order.nomeCliente}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${order.descricao}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${order.contato}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(order.valorTotal)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(order.valorAdiantado)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(order.valorTotal - order.valorAdiantado)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${formatDate(order.dataCriacao)}</td>
        </tr>
      `).join('');

      return `
        <div class="gestor-section">
          <div class="gestor-header">
            <h3 style="margin: 0; color: #1f2937; font-size: 20px; display: flex; align-items: center; gap: 10px;">
              <span style="background: #3b82f6; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">
                ${gestorData.gestor.charAt(0).toUpperCase()}
              </span>
              ${gestorData.gestor}
            </h3>
            <div style="margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; background: #f8fafc; padding: 15px; border-radius: 6px;">
              <div style="text-align: center;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Encomendas</div>
                <div style="font-size: 16px; font-weight: 600; color: #1f2937;">${gestorData.encomendas.length}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Valor Total</div>
                <div style="font-size: 16px; font-weight: 600; color: #1f2937;">${formatCurrency(gestorTotalValue)}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Adiantado</div>
                <div style="font-size: 16px; font-weight: 600; color: #1f2937;">${formatCurrency(gestorTotalAdvanced)}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Restante</div>
                <div style="font-size: 16px; font-weight: 600; color: #1f2937;">${formatCurrency(gestorTotalValue - gestorTotalAdvanced)}</div>
              </div>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-top: 20px;">
            <thead>
              <tr>
                <th style="background: #3b82f6; color: white; padding: 16px 12px; text-align: left; font-weight: 600; font-size: 14px;">ID</th>
                <th style="background: #3b82f6; color: white; padding: 16px 12px; text-align: left; font-weight: 600; font-size: 14px;">Cliente</th>
                <th style="background: #3b82f6; color: white; padding: 16px 12px; text-align: left; font-weight: 600; font-size: 14px;">Descrição</th>
                <th style="background: #3b82f6; color: white; padding: 16px 12px; text-align: left; font-weight: 600; font-size: 14px;">Contato</th>
                <th style="background: #3b82f6; color: white; padding: 16px 12px; text-align: right; font-weight: 600; font-size: 14px;">Valor Total</th>
                <th style="background: #3b82f6; color: white; padding: 16px 12px; text-align: right; font-weight: 600; font-size: 14px;">Adiantado</th>
                <th style="background: #3b82f6; color: white; padding: 16px 12px; text-align: right; font-weight: 600; font-size: 14px;">Restante</th>
                <th style="background: #3b82f6; color: white; padding: 16px 12px; text-align: left; font-weight: 600; font-size: 14px;">Data Criação</th>
              </tr>
            </thead>
            <tbody>
              ${orderRows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Encomendas - ${statusLabel}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #1f2937;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: #3b82f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        h1 {
            color: #1f2937;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        }
        .report-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .info-item {
            text-align: center;
        }
        .info-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
        }
        .summary {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        .summary h3 {
            margin: 0 0 15px 0;
            color: #0369a1;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        .summary-item {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 6px;
        }
        .gestor-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .gestor-header {
            margin-bottom: 20px;
            padding: 20px;
            background: #fafafa;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        th {
            background: #3b82f6;
            color: white;
            padding: 16px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }
        th:nth-child(5), th:nth-child(6), th:nth-child(7) {
            text-align: right;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
        }
        tr:hover {
            background: #f9fafb;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #6b7280;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; }
            .header { page-break-inside: avoid; }
            .gestor-section { page-break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">MG</div>
        <h1>Relatório de Encomendas</h1>
        <p class="subtitle">Sistema de Gestão de Encomendas</p>
    </div>

    <div class="report-info">
        <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">${statusLabel}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Gestor</div>
            <div class="info-value">${gestorLabel}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Data de Geração</div>
            <div class="info-value">${currentDate}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Total de Encomendas</div>
            <div class="info-value">${totalOrders}</div>
        </div>
    </div>

    ${totalOrders > 0 ? `
    ${gestorSections}

    <div class="summary">
        <h3>Resumo Financeiro Geral</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="info-label">Valor Total</div>
                <div class="info-value">${formatCurrency(totalValue)}</div>
            </div>
            <div class="summary-item">
                <div class="info-label">Valor Adiantado</div>
                <div class="info-value">${formatCurrency(totalAdvanced)}</div>
            </div>
            <div class="summary-item">
                <div class="info-label">Valor Restante</div>
                <div class="info-value">${formatCurrency(resumoFinanceiro.totalPendente)}</div>
            </div>
            <div class="summary-item">
                <div class="info-label">Gestores</div>
                <div class="info-value">${reportData.length}</div>
            </div>
        </div>
    </div>
    ` : `
    <div class="empty-state">
        <h3>Nenhuma encomenda encontrada</h3>
        <p>Não existem encomendas para os filtros selecionados.</p>
    </div>
    `}

    <div class="footer">
        <p>© 2025. Built with ❤️ using <a href="https://caffeine.ai" style="color: #3b82f6; text-decoration: none;">caffeine.ai</a></p>
        <p>Relatório gerado em ${new Date().toLocaleString('pt-PT')}</p>
    </div>
</body>
</html>
    `;
  };

  const handleReset = () => {
    setSelectedStatus('');
    setSelectedGestor('all');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Gerar Relatório PDF
          </DialogTitle>
          <DialogDescription>
            Selecione os filtros para gerar um relatório em PDF das encomendas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status das Encomendas</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as Status)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gestor">Gestor</Label>
            <Select value={selectedGestor} onValueChange={setSelectedGestor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o gestor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os gestores</SelectItem>
                {gestores.data?.map((gestor) => (
                  <SelectItem key={gestor.nome} value={gestor.nome}>
                    {gestor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isGenerating}
          >
            Limpar
          </Button>
          <Button
            onClick={generatePDF}
            disabled={!selectedStatus || isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isGenerating ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
