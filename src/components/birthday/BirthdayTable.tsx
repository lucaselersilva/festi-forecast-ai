import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Copy, Mail, Phone } from "lucide-react";
import { BirthdayCustomer, formatBirthdayDate, getRecencyBadgeColor, getRecencyLabel, copyContactToClipboard } from "@/lib/birthdayHelpers";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BirthdayTableProps {
  customers: BirthdayCustomer[];
  onViewDetails: (customer: BirthdayCustomer) => void;
}

export function BirthdayTable({ customers, onViewDetails }: BirthdayTableProps) {
  const { toast } = useToast();
  const [sortColumn, setSortColumn] = useState<keyof BirthdayCustomer>('aniversario');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof BirthdayCustomer) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleCopyContact = async (customer: BirthdayCustomer) => {
    try {
      await copyContactToClipboard(customer);
      toast({
        title: "Contato copiado!",
        description: "Dados de contato copiados para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Nenhum aniversariante encontrado neste período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Aniversariantes do Mês</span>
          <Badge variant="secondary">{customers.length} pessoas</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('nome')}
                >
                  Nome
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('aniversario')}
                >
                  Aniversário
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-foreground text-right"
                  onClick={() => handleSort('consumo')}
                >
                  Consumo
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-foreground text-center"
                  onClick={() => handleSort('recency_days')}
                >
                  Status
                </TableHead>
                <TableHead className="text-center">Presenças</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead className="text-center">Contato</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{customer.nome}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{formatBirthdayDate(customer.aniversario)}</span>
                      {customer.idade && (
                        <span className="text-xs text-muted-foreground">{customer.idade} anos</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {customer.consumo?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className={getRecencyBadgeColor(customer.recency_days)}
                    >
                      {getRecencyLabel(customer.recency_days)}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {customer.recency_days}d
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">{customer.presencas}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {customer.cluster_comportamental}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <TooltipProvider>
                      <div className="flex items-center justify-center gap-1">
                        {customer.email && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Mail className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{customer.email}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {customer.telefone && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Phone className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{customer.telefone}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(customer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyContact(customer)}
                        disabled={!customer.email && !customer.telefone}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}