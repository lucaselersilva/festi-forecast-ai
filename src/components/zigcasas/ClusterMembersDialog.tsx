import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/useTenant";
import { Mail, Phone, Calendar, TrendingUp, DollarSign } from "lucide-react";

interface ClusterMember {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  aniversario: string | null;
  idade: number | null;
  consumo: number;
  presencas: number;
  recency_days: number;
  ultima_visita: string;
  genero: string;
  aplicativo_ativo: boolean;
}

interface ClusterMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clusterName: string;
}

export function ClusterMembersDialog({
  open,
  onOpenChange,
  clusterName,
}: ClusterMembersDialogProps) {
  const [members, setMembers] = useState<ClusterMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { tenantId } = useTenant();

  useEffect(() => {
    if (open && clusterName && tenantId) {
      loadMembers();
    }
  }, [open, clusterName, tenantId]);

  const loadMembers = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vw_valle_rfm")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("cluster_comportamental", clusterName)
        .order("consumo", { ascending: false })
        .limit(100);

      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      console.error("Error loading cluster members:", error);
      toast({
        title: "Erro ao carregar membros",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Membros do Cluster: {clusterName}</DialogTitle>
          <DialogDescription>
            {members.length} {members.length === 1 ? "cliente" : "clientes"} neste cluster
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              Nenhum cliente encontrado neste cluster
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Consumo</TableHead>
                  <TableHead className="text-center">Presenças</TableHead>
                  <TableHead className="text-center">Recência</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{member.nome}</p>
                        {member.aniversario && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(member.aniversario)}
                            {member.idade && ` (${member.idade} anos)`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {member.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{member.email}</span>
                          </div>
                        )}
                        {member.telefone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {member.telefone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="font-semibold">{formatCurrency(member.consumo)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{member.presencas}x</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium">{Math.round(member.recency_days)} dias</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(member.ultima_visita)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1">
                        {member.aplicativo_ativo && (
                          <Badge variant="default" className="text-xs">App Ativo</Badge>
                        )}
                        {member.genero && (
                          <Badge variant="outline" className="text-xs">{member.genero}</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
