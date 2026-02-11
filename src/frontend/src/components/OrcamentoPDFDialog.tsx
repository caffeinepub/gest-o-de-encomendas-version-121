import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';
import { useActor } from '../hooks/useActor';
import type { Orcamento, Cliente, Empresa, Rodape, FileReference } from '../backend';
import { CONDICOES_GERAIS_VENDA_GARANTIA } from '../constants/orcamentoGeneralTermsPT';

interface OrcamentoPDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: Orcamento | null;
}

export default function OrcamentoPDFDialog({ open, onOpenChange, orcamento }: OrcamentoPDFDialogProps) {
  const [pdfData, setPdfData] = useState<{ orcamento: Orcamento; cliente: Cliente; empresa: Empresa; rodape?: Rodape; imagemAdicional?: FileReference } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { actor } = useActor();

  useEffect(() => {
    const fetchPDFData = async () => {
      if (orcamento && actor && open) {
        setIsLoading(true);
        try {
          const data = await actor.getDadosOrcamentoPDF(orcamento.id);
          setPdfData(data);
        } catch (error) {
          console.error('Error fetching PDF data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPDFData();
  }, [orcamento, actor, open]);

  const formatCurrency = (value: bigint) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(value) / 100);
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('pt-PT');
  };

  const handleDownloadPDF = () => {
    if (!pdfData) return;

    const { orcamento, cliente, empresa, rodape, imagemAdicional } = pdfData;

    const subtotal = orcamento.itens.reduce((sum, item) => sum + Number(item.subtotal), 0);
    
    const descontoRate = Number(orcamento.desconto);
    const descontoAmount = (subtotal * descontoRate) / 100;
    
    const subtotalComDesconto = subtotal - descontoAmount;
    
    const ivaRate = Number(orcamento.iva);
    const ivaAmount = (subtotalComDesconto * ivaRate) / 100;
    
    const totalComIva = subtotalComDesconto + ivaAmount;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Orçamento #${orcamento.id}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.3;
            color: #000;
          }
          .page {
            page-break-after: always;
            position: relative;
            min-height: 277mm;
            display: flex;
            flex-direction: column;
          }
          .page:last-child {
            page-break-after: auto;
          }
          .content-wrapper {
            flex: 1;
            padding: 10mm;
            padding-bottom: 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #000;
          }
          .logo-section {
            flex: 0 0 auto;
          }
          .logo {
            width: 100px;
            height: auto;
            display: block;
          }
          .company-info {
            text-align: right;
            flex: 1;
            padding-left: 20px;
          }
          .company-info h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 3px;
            color: #000;
          }
          .company-info p {
            margin: 1px 0;
            font-size: 9pt;
            color: #333;
          }
          .document-number {
            text-align: right;
            font-size: 11pt;
            font-weight: bold;
            margin: 10px 0 15px 0;
            color: #000;
          }
          .client-section {
            margin-bottom: 15px;
            padding: 8px;
            background-color: #f5f5f5;
            border-left: 3px solid #000;
          }
          .client-section h3 {
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 5px;
            color: #000;
          }
          .client-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
            font-size: 9pt;
          }
          .client-info .info-item {
            display: flex;
          }
          .client-info .info-item strong {
            min-width: 60px;
            font-weight: bold;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            border: 0.5px solid #000;
          }
          .items-table thead tr {
            background-color: #000;
          }
          .items-table th {
            background-color: #000;
            color: #fff;
            padding: 10px 8px;
            text-align: left;
            font-size: 10pt;
            font-weight: bold;
            border: none;
          }
          .items-table th.text-right {
            text-align: right;
          }
          .items-table th.text-center {
            text-align: center;
          }
          .items-table tbody tr {
            border-bottom: 0.5px solid #ddd;
          }
          .items-table tbody tr:last-child {
            border-bottom: none;
          }
          .items-table td {
            padding: 8px;
            font-size: 9pt;
            vertical-align: top;
            border: none;
          }
          .items-table .description-cell {
            line-height: 1.4;
          }
          .items-table .description {
            font-size: 8pt;
            color: #555;
            margin-top: 3px;
            line-height: 1.3;
          }
          .items-table .text-right {
            text-align: right;
          }
          .items-table .text-center {
            text-align: center;
          }
          .total-section {
            margin-top: 15px;
            text-align: right;
          }
          .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 3px;
            font-size: 10pt;
          }
          .total-row.subtotal {
            padding-bottom: 5px;
          }
          .total-row.desconto-row {
            color: #d32f2f;
            font-size: 5pt;
          }
          .total-row.subtotal-desconto {
            padding-bottom: 5px;
            border-bottom: 0.5px solid #ddd;
            font-size: 5pt;
          }
          .total-row.iva-row {
            padding-bottom: 5px;
            border-bottom: 0.5px solid #ddd;
            font-size: 5pt;
          }
          .total-row.grand-total {
            font-size: 13pt;
            font-weight: bold;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #000;
          }
          .total-label {
            width: 150px;
            text-align: right;
            padding-right: 15px;
            font-weight: bold;
          }
          .total-value {
            width: 120px;
            text-align: right;
          }
          .conditions-section {
            margin-top: 20px;
            padding: 10px;
            background-color: #f9f9f9;
            border: 0.5px solid #ddd;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .conditions-section .condition-item {
            display: flex;
            flex-direction: column;
          }
          .conditions-section .condition-item strong {
            font-size: 9pt;
            font-weight: bold;
            margin-bottom: 4px;
            color: #000;
          }
          .conditions-section .condition-item p {
            font-size: 9pt;
            color: #333;
            margin: 0;
          }
          .observations {
            margin-top: 15px;
            padding: 10px;
            background-color: #f9f9f9;
            border-left: 3px solid #000;
          }
          .observations h3 {
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 5px;
            color: #000;
          }
          .observations p {
            font-size: 9pt;
            white-space: pre-wrap;
            color: #333;
          }
          .footer {
            margin-top: auto;
            padding: 10px 15px;
            border-top: 0.5px solid #000;
            background-color: #f5f5f5;
            font-size: 8pt;
            line-height: 1.5;
            color: #000;
          }
          .footer-content {
            white-space: pre-wrap;
            text-align: center;
            font-family: Arial, sans-serif;
          }
          .caffeine-branding {
            position: fixed;
            bottom: 3mm;
            left: 10mm;
            font-size: 5pt;
            color: #ccc;
            text-align: left;
          }
          .caffeine-branding a {
            color: #ccc;
            text-decoration: none;
          }
          .terms-page {
            padding: 15mm;
          }
          .terms-page h2 {
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 15px;
            color: #000;
          }
          .terms-content {
            font-size: 8pt;
            line-height: 1.4;
            white-space: pre-wrap;
            color: #000;
          }
          .additional-image-page {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 277mm;
          }
          .additional-image-page img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="content-wrapper">
            <div class="header">
              <div class="logo-section">
                <img src="/assets/simbol.jpg" alt="Logo" class="logo" onerror="this.style.display='none'">
              </div>
              <div class="company-info">
                <h1>${empresa.nome || 'Gestão de Encomendas'}</h1>
                ${empresa.morada ? `<p>${empresa.morada}</p>` : ''}
                ${empresa.telefone ? `<p>Tel: ${empresa.telefone}</p>` : ''}
                ${empresa.email ? `<p>Email: ${empresa.email}</p>` : ''}
              </div>
            </div>

            <div class="document-number">
              Orçamento nº ${orcamento.id} - ${formatDate(orcamento.dataOrcamento)}
            </div>

            <div class="client-section">
              <h3>Cliente</h3>
              <div class="client-info">
                <div class="info-item"><strong>Nome:</strong> <span>${cliente.nome}</span></div>
                <div class="info-item"><strong>Contato:</strong> <span>${cliente.contato || 'N/A'}</span></div>
                <div class="info-item"><strong>Morada:</strong> <span>${cliente.morada || 'N/A'}</span></div>
                <div class="info-item"><strong>NIF:</strong> <span>${cliente.nif || 'N/A'}</span></div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 50%;">Descrição</th>
                  <th style="width: 15%;" class="text-center">Qtd</th>
                  <th style="width: 17.5%;" class="text-right">Preço Unit.</th>
                  <th style="width: 17.5%;" class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${orcamento.itens.map(item => `
                  <tr>
                    <td class="description-cell">
                      ${item.nomeMaterial || item.descricao || '<em>Sem descrição</em>'}
                      ${item.nomeMaterial && item.descricao ? `<div class="description">${item.descricao}</div>` : ''}
                    </td>
                    <td class="text-center">${item.quantidade}</td>
                    <td class="text-right">${formatCurrency(item.precoUnitario)}</td>
                    <td class="text-right">${formatCurrency(item.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-section">
              <div class="total-row subtotal">
                <div class="total-label">Subtotal:</div>
                <div class="total-value">${formatCurrency(BigInt(subtotal))}</div>
              </div>
              ${descontoRate > 0 ? `
                <div class="total-row desconto-row">
                  <div class="total-label">Desconto (${descontoRate}%):</div>
                  <div class="total-value">-${formatCurrency(BigInt(Math.round(descontoAmount)))}</div>
                </div>
                <div class="total-row subtotal-desconto">
                  <div class="total-label">Subtotal com desconto:</div>
                  <div class="total-value">${formatCurrency(BigInt(Math.round(subtotalComDesconto)))}</div>
                </div>
              ` : ''}
              <div class="total-row iva-row">
                <div class="total-label">IVA (${ivaRate}%):</div>
                <div class="total-value">${formatCurrency(BigInt(Math.round(ivaAmount)))}</div>
              </div>
              <div class="total-row grand-total">
                <div class="total-label">TOTAL:</div>
                <div class="total-value">${formatCurrency(BigInt(Math.round(totalComIva)))}</div>
              </div>
            </div>

            ${(orcamento.condicoesFornecimento || orcamento.validadeOrcamento) ? `
              <div class="conditions-section">
                ${orcamento.condicoesFornecimento ? `
                  <div class="condition-item">
                    <strong>Condições de fornecimento:</strong>
                    <p>${orcamento.condicoesFornecimento}</p>
                  </div>
                ` : '<div></div>'}
                ${orcamento.validadeOrcamento ? `
                  <div class="condition-item">
                    <strong>Validade do orçamento:</strong>
                    <p>${orcamento.validadeOrcamento}</p>
                  </div>
                ` : '<div></div>'}
              </div>
            ` : ''}

            ${orcamento.observacoes ? `
              <div class="observations">
                <h3>Observações</h3>
                <p>${orcamento.observacoes}</p>
              </div>
            ` : ''}
          </div>

          ${rodape && rodape.textoCompleto ? `
            <div class="footer">
              <div class="footer-content">${rodape.textoCompleto}</div>
            </div>
          ` : ''}

          <div class="caffeine-branding">
            Built with caffeine.ai
          </div>
        </div>

        <div class="page">
          <div class="terms-page">
            <h2>CONDIÇÕES GERAIS DE VENDA E GARANTIA</h2>
            <div class="terms-content">${CONDICOES_GERAIS_VENDA_GARANTIA}</div>
          </div>
        </div>

        ${imagemAdicional ? `
          <div class="page additional-image-page">
            <img src="${window.location.origin}/storage/${imagemAdicional.hash}" alt="Condições detalhadas" />
          </div>
        ` : ''}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  if (!orcamento || isLoading || !pdfData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar PDF do Orçamento</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { cliente } = pdfData;

  const subtotal = pdfData.orcamento.itens.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const descontoRate = Number(pdfData.orcamento.desconto);
  const descontoAmount = (subtotal * descontoRate) / 100;
  const subtotalComDesconto = subtotal - descontoAmount;
  const ivaRate = Number(pdfData.orcamento.iva);
  const ivaAmount = (subtotalComDesconto * ivaRate) / 100;
  const totalComIva = subtotalComDesconto + ivaAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerar PDF do Orçamento</DialogTitle>
          <DialogDescription>
            Visualize e imprima o orçamento em formato profissional
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-semibold mb-2">Informações do Orçamento</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Cliente:</strong> {cliente.nome}</p>
              <p><strong>Data:</strong> {formatDate(orcamento.dataOrcamento)}</p>
              <p><strong>Total de Artigos:</strong> {orcamento.itens.length}</p>
              <p><strong>Subtotal:</strong> {formatCurrency(BigInt(subtotal))}</p>
              {descontoRate > 0 && (
                <p className="text-red-600"><strong>Desconto ({descontoRate}%):</strong> -{formatCurrency(BigInt(Math.round(descontoAmount)))}</p>
              )}
              {descontoRate > 0 && (
                <p><strong>Subtotal com desconto:</strong> {formatCurrency(BigInt(Math.round(subtotalComDesconto)))}</p>
              )}
              <p><strong>IVA ({ivaRate}%):</strong> {formatCurrency(BigInt(Math.round(ivaAmount)))}</p>
              <p className="text-lg font-bold mt-2"><strong>TOTAL:</strong> {formatCurrency(BigInt(Math.round(totalComIva)))}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDownloadPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
