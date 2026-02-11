import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, ChevronDown } from 'lucide-react';
import { useGetTabelaPreco, useSaveTabelaPreco, useUpdateTituloColuna, useInsertRowAbove, useInsertRowBelow, useDeleteRow } from '@/hooks/useQueries';
import { Input } from '@/components/ui/input';
import { debounce } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PriceTablesManagementProps {
  onBack: () => void;
}

type Category = 'Carpintaria' | 'Cozinhas' | 'Roupeiros' | 'Portas';

const CATEGORIES: Category[] = ['Carpintaria', 'Cozinhas', 'Roupeiros', 'Portas'];

export default function PriceTablesManagement({ onBack }: PriceTablesManagementProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h2 className="text-2xl font-bold">Tabelas de Preço</h2>
        <div className="w-24"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category)}
            className="h-20 text-lg"
          >
            {category}
          </Button>
        ))}
      </div>

      {selectedCategory && (
        <PriceTable category={selectedCategory} />
      )}
    </div>
  );
}

interface PriceTableProps {
  category: Category;
}

function PriceTable({ category }: PriceTableProps) {
  const { data: tabelaData, isLoading } = useGetTabelaPreco(category);
  const saveTabelaMutation = useSaveTabelaPreco();
  const updateTituloMutation = useUpdateTituloColuna();
  const insertRowAboveMutation = useInsertRowAbove();
  const insertRowBelowMutation = useInsertRowBelow();
  const deleteRowMutation = useDeleteRow();
  const [rows, setRows] = useState<Array<{ descricao: string; colunas: string[] }>>([]);
  const [columnTitles, setColumnTitles] = useState<string[]>([
    'Descrição',
    'Col1',
    'Col2',
    'Col3',
    'Col4',
    'Col5',
  ]);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize data from backend
  useEffect(() => {
    if (tabelaData) {
      if (tabelaData.linhas.length > 0) {
        setRows(tabelaData.linhas);
      } else {
        const initialRows = Array.from({ length: 10 }, () => ({
          descricao: '',
          colunas: Array(5).fill(''),
        }));
        setRows(initialRows);
      }
      
      if (tabelaData.titulosColunas && tabelaData.titulosColunas.length === 6) {
        setColumnTitles(tabelaData.titulosColunas);
      }
    } else {
      const initialRows = Array.from({ length: 10 }, () => ({
        descricao: '',
        colunas: Array(5).fill(''),
      }));
      setRows(initialRows);
    }
  }, [tabelaData]);

  // Debounced save function with 5 second delay
  const debouncedSave = useCallback(
    debounce(async (updatedRows: Array<{ descricao: string; colunas: string[] }>, titles: string[]) => {
      setSaveStatus('saving');
      try {
        await saveTabelaMutation.mutateAsync({
          categoria: category,
          linhas: updatedRows,
          titulosColunas: titles,
        });
        setSaveStatus('saved');
        
        // Clear saved status after 2 seconds
        if (statusTimeoutRef.current) {
          clearTimeout(statusTimeoutRef.current);
        }
        statusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Erro ao salvar tabela:', error);
        setSaveStatus('error');
        
        // Clear error status after 3 seconds
        if (statusTimeoutRef.current) {
          clearTimeout(statusTimeoutRef.current);
        }
        statusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      }
    }, 5000), // 5 seconds delay
    [category, saveTabelaMutation]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const handleCellChange = (rowIndex: number, columnIndex: number, value: string) => {
    // Update local state immediately for fluid typing (no flicker)
    const updatedRows = [...rows];
    if (columnIndex === -1) {
      updatedRows[rowIndex].descricao = value;
    } else {
      updatedRows[rowIndex].colunas[columnIndex] = value;
    }
    setRows(updatedRows);
    
    // Trigger debounced save (5 seconds after user stops typing)
    debouncedSave(updatedRows, columnTitles);
  };

  const handleTitleChange = async (columnIndex: number, newTitle: string) => {
    const updatedTitles = [...columnTitles];
    updatedTitles[columnIndex] = newTitle;
    setColumnTitles(updatedTitles);
    setEditingTitle(null);
    
    try {
      await updateTituloMutation.mutateAsync({
        categoria: category,
        novoTitulo: newTitle,
        colunaIndex: BigInt(columnIndex),
      });
    } catch (error) {
      console.error('Erro ao atualizar título:', error);
    }
  };

  const addRow = () => {
    const newRow = {
      descricao: '',
      colunas: Array(5).fill(''),
    };
    const updatedRows = [...rows, newRow];
    setRows(updatedRows);
    debouncedSave(updatedRows, columnTitles);
  };

  const handleInsertRowAbove = async (rowIndex: number) => {
    const newRow = {
      descricao: '',
      colunas: Array(5).fill(''),
    };
    
    try {
      await insertRowAboveMutation.mutateAsync({
        categoria: category,
        linhaIndex: BigInt(rowIndex),
        novaLinha: newRow,
      });
    } catch (error) {
      console.error('Erro ao inserir linha acima:', error);
    }
  };

  const handleInsertRowBelow = async (rowIndex: number) => {
    const newRow = {
      descricao: '',
      colunas: Array(5).fill(''),
    };
    
    try {
      await insertRowBelowMutation.mutateAsync({
        categoria: category,
        linhaIndex: BigInt(rowIndex),
        novaLinha: newRow,
      });
    } catch (error) {
      console.error('Erro ao inserir linha abaixo:', error);
    }
  };

  const handleDeleteRowClick = (rowIndex: number) => {
    setRowToDelete(rowIndex);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteRowConfirm = async () => {
    if (rowToDelete === null) return;
    
    try {
      await deleteRowMutation.mutateAsync({
        categoria: category,
        linhaIndex: BigInt(rowToDelete),
      });
      setDeleteConfirmOpen(false);
      setRowToDelete(null);
    } catch (error) {
      console.error('Erro ao eliminar linha:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{category}</h3>
        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          {saveStatus === 'saving' && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              A guardar...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Guardado
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-destructive">Erro ao guardar</span>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 w-12"></th>
              {columnTitles.map((title, index) => (
                <th
                  key={index}
                  className={`border p-2 font-semibold ${
                    index === 0 ? 'text-left w-80' : 'text-center'
                  }`}
                >
                  {editingTitle === index ? (
                    <Input
                      value={title}
                      onChange={(e) => {
                        const updatedTitles = [...columnTitles];
                        updatedTitles[index] = e.target.value;
                        setColumnTitles(updatedTitles);
                      }}
                      onBlur={() => handleTitleChange(index, columnTitles[index])}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTitleChange(index, columnTitles[index]);
                        }
                      }}
                      className="border-0 focus-visible:ring-1 focus-visible:ring-primary text-center font-semibold"
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() => setEditingTitle(index)}
                      className="cursor-pointer hover:bg-muted-foreground/10 rounded px-2 py-1"
                      title="Clique para editar"
                    >
                      {title}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/50">
                <td className="border p-1 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Opções de linha"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => handleInsertRowAbove(rowIndex)}
                        disabled={insertRowAboveMutation.isPending}
                      >
                        Adicionar Linha Acima
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleInsertRowBelow(rowIndex)}
                        disabled={insertRowBelowMutation.isPending}
                      >
                        Adicionar Linha Abaixo
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteRowClick(rowIndex)}
                        disabled={deleteRowMutation.isPending}
                        className="text-destructive focus:text-destructive"
                      >
                        Eliminar Linha
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                <td className="border p-1">
                  <Input
                    value={row.descricao}
                    onChange={(e) => handleCellChange(rowIndex, -1, e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Descrição..."
                  />
                </td>
                {row.colunas.map((col, colIndex) => (
                  <td key={colIndex} className="border p-1">
                    <Input
                      value={col}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={addRow} variant="outline" className="w-full">
        Adicionar Linha
      </Button>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar esta linha? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRowToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRowConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
