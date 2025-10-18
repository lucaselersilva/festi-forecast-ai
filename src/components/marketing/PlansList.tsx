import { useState, useEffect } from "react";
import { Search, Eye, Edit, Copy, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatEventDate, parseSearchCommand } from "@/lib/marketingHelpers";
import { toast } from "sonner";

interface MarketingPlanRow {
  id: string;
  event_name: string;
  event_date: string;
  event_city: string;
  status: string;
  created_at: string;
}

interface PlansListProps {
  onView: (planId: string) => void;
  onEdit: (planId: string) => void;
  onDuplicate: (planId: string) => void;
}

export function PlansList({ onView, onEdit, onDuplicate }: PlansListProps) {
  const [plans, setPlans] = useState<MarketingPlanRow[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<MarketingPlanRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    filterPlans();
  }, [searchQuery, statusFilter, plans]);

  const loadPlans = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("marketing_plans")
      .select("id, event_name, event_date, event_city, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar planos");
      console.error(error);
    } else {
      setPlans(data || []);
    }
    setIsLoading(false);
  };

  const filterPlans = () => {
    let filtered = [...plans];

    // Filtro de status
    if (statusFilter !== "all") {
      filtered = filtered.filter((plan) => plan.status === statusFilter);
    }

    // Filtro de busca
    if (searchQuery.trim()) {
      const searchParams = parseSearchCommand(searchQuery);

      if (searchParams.type === "name") {
        filtered = filtered.filter((plan) =>
          plan.event_name.toLowerCase().includes(searchParams.value.toLowerCase())
        );
      } else if (searchParams.type === "city") {
        filtered = filtered.filter((plan) =>
          plan.event_city.toLowerCase().includes(searchParams.value.toLowerCase())
        );
      } else if (searchParams.type === "status") {
        filtered = filtered.filter((plan) => plan.status === searchParams.value);
      } else {
        // Busca geral
        filtered = filtered.filter(
          (plan) =>
            plan.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            plan.event_city.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    }

    setFilteredPlans(filtered);
  };

  const handleArchive = async (planId: string) => {
    const { error } = await supabase
      .from("marketing_plans")
      .update({ status: "archived" })
      .eq("id", planId);

    if (error) {
      toast.error("Erro ao arquivar plano");
    } else {
      toast.success("Plano arquivado");
      loadPlans();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      draft: "secondary",
      active: "default",
      completed: "outline",
      archived: "outline",
    };

    const labels: Record<string, string> = {
      draft: "Rascunho",
      active: "Ativo",
      completed: "Concluído",
      archived: "Arquivado",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder='Buscar planos... (ex: "evento X", "em São Paulo")'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando planos...
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum plano encontrado
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Evento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.map((plan) => (
              <TableRow key={plan.id} className="cursor-pointer hover:bg-accent/50">
                <TableCell className="font-medium">{plan.event_name}</TableCell>
                <TableCell>{formatEventDate(plan.event_date)}</TableCell>
                <TableCell>{plan.event_city}</TableCell>
                <TableCell>{getStatusBadge(plan.status)}</TableCell>
                <TableCell>
                  {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(plan.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(plan.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDuplicate(plan.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {plan.status !== "archived" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(plan.id)}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
