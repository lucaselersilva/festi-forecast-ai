import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { BirthdayMetrics as MetricsType } from "@/lib/birthdayHelpers";

interface BirthdayMetricsProps {
  metrics: MetricsType;
}

export function BirthdayMetrics({ metrics }: BirthdayMetricsProps) {
  const metricCards = [
    {
      icon: Users,
      label: "Total de Aniversariantes",
      value: metrics.totalCelebrantes.toLocaleString(),
      description: "pessoas",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: DollarSign,
      label: "Consumo Médio",
      value: `R$ ${metrics.consumoMedio.toFixed(2)}`,
      description: "por pessoa",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Calendar,
      label: "Recência Média",
      value: Math.round(metrics.recenciaMedia),
      description: "dias desde última visita",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: TrendingUp,
      label: "Presenças Médias",
      value: metrics.taxaPresencaMedia.toFixed(1),
      description: "eventos por pessoa",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className={`text-3xl font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}