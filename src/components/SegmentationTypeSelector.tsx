import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Activity, Music, Target } from "lucide-react";

export type SegmentationType = 'valle-rfm' | 'rfm' | 'demographic' | 'behavioral' | 'musical' | 'multi-dimensional';

interface SegmentationTypeSelectorProps {
  value: SegmentationType;
  onChange: (value: SegmentationType) => void;
}

export function SegmentationTypeSelector({ value, onChange }: SegmentationTypeSelectorProps) {
  const types = [
    {
      value: 'valle-rfm' as const,
      label: 'Valle RFM',
      description: 'RFM dos dados do Valle (customers)',
      icon: TrendingUp,
      features: ['Recência de visita', 'Presenças', 'Consumo total']
    },
    // Temporarily disabled
    // {
    //   value: 'rfm' as const,
    //   label: 'RFM Clássico',
    //   description: 'RFM baseado em interações',
    //   icon: TrendingUp,
    //   features: ['Recência de compra', 'Frequência de interações', 'Valor monetário total']
    // },
    {
      value: 'demographic' as const,
      label: 'Demográfica',
      description: 'Idade, Gênero e Localização',
      icon: Users,
      features: ['Faixa etária', 'Gênero', 'Cidade']
    },
    {
      value: 'behavioral' as const,
      label: 'Comportamental',
      description: 'Padrões de compra e timing',
      icon: Activity,
      features: ['Dias entre compras', 'Antecedência de compra', 'Padrões de consumo']
    },
    // Temporarily disabled
    // {
    //   value: 'musical' as const,
    //   label: 'Musical',
    //   description: 'Preferências de gênero',
    //   icon: Music,
    //   features: ['Gênero preferido', 'Diversidade', 'Frequência por gênero']
    // },
    {
      value: 'multi-dimensional' as const,
      label: 'Multi-Dimensional',
      description: 'Análise combinada RFM + Demografia + Comportamento',
      icon: Target,
      features: ['RFM completo', 'Perfil demográfico', 'Padrão comportamental']
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tipo de Segmentação</h3>
        <p className="text-sm text-muted-foreground">
          Escolha o tipo de análise para agrupar seus clientes
        </p>
      </div>
      
      <RadioGroup value={value} onValueChange={(val) => onChange(val as SegmentationType)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {types.map((type) => {
            const Icon = type.icon;
            const isSelected = value === type.value;
            
            return (
              <Card 
                key={type.value}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-primary shadow-md' 
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => onChange(type.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                    <div className="flex-1">
                      <Label 
                        htmlFor={type.value} 
                        className="flex items-center gap-2 cursor-pointer font-semibold mb-1"
                      >
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        {type.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {type.features.map((feature) => (
                          <span 
                            key={feature}
                            className="text-xs bg-muted px-2 py-1 rounded-md"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}
