import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Calendar, DollarSign, TrendingUp, User, MapPin } from "lucide-react";
import { BirthdayCustomer, formatBirthdayDate, getRecencyBadgeColor, getRecencyLabel } from "@/lib/birthdayHelpers";

interface BirthdayCustomerDetailsProps {
  customer: BirthdayCustomer | null;
  open: boolean;
  onClose: () => void;
}

export function BirthdayCustomerDetails({ customer, open, onClose }: BirthdayCustomerDetailsProps) {
  if (!customer) return null;

  const handleWhatsApp = () => {
    if (customer.telefone) {
      const cleanPhone = customer.telefone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  const handleEmail = () => {
    if (customer.email) {
      window.location.href = `mailto:${customer.email}`;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {customer.nome}
          </SheetTitle>
          <SheetDescription>
            Informações detalhadas do cliente
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Badges de Status */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{customer.cluster_comportamental}</Badge>
            {customer.cluster_valor && (
              <Badge variant="outline">{customer.cluster_valor}</Badge>
            )}
            <Badge 
              variant="outline" 
              className={getRecencyBadgeColor(customer.recency_days)}
            >
              {getRecencyLabel(customer.recency_days)}
            </Badge>
          </div>

          <Separator />

          {/* Informações Pessoais */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Informações Pessoais
            </h3>
            
            <div className="space-y-2">
              {customer.aniversario && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Aniversário:</span>
                  <span className="font-medium">
                    {formatBirthdayDate(customer.aniversario)}
                    {customer.idade && ` (${customer.idade} anos)`}
                  </span>
                </div>
              )}

              {customer.faixa_etaria && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Faixa Etária:</span>
                  <span className="font-medium">{customer.faixa_etaria}</span>
                </div>
              )}

              {customer.genero && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Gênero:</span>
                  <span className="font-medium">{customer.genero}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Contato */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contato
            </h3>
            
            <div className="space-y-2">
              {customer.telefone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{customer.telefone}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleWhatsApp}>
                    WhatsApp
                  </Button>
                </div>
              )}

              {customer.email && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-xs">{customer.email}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleEmail}>
                    Email
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Métricas de Consumo */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Histórico de Consumo
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Consumo Total</span>
                </div>
                <p className="text-2xl font-bold">
                  R$ {customer.consumo?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Presenças</span>
                </div>
                <p className="text-2xl font-bold">{customer.presencas}</p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Última Visita</span>
                </div>
                <p className="text-sm font-medium">
                  {customer.ultima_visita 
                    ? new Date(customer.ultima_visita).toLocaleDateString('pt-BR')
                    : 'Nunca'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {customer.recency_days} dias atrás
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Propensão</span>
                </div>
                <p className="text-2xl font-bold">
                  {(customer.propensity_score * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          {customer.primeira_entrada && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Cliente desde:</span>{' '}
                {new Date(customer.primeira_entrada).toLocaleDateString('pt-BR')}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}