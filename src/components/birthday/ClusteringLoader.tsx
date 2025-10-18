import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Database, Brain, Target } from "lucide-react";
import { useEffect, useState } from "react";

const steps = [
  { icon: Database, label: "Analisando aniversariantes...", duration: 2000 },
  { icon: Brain, label: "Identificando clusters...", duration: 3000 },
  { icon: Target, label: "Gerando estratégias personalizadas...", duration: 4000 },
  { icon: Sparkles, label: "Finalizando ações...", duration: 2000 }
];

export function ClusteringLoader() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      setProgress((elapsed / totalDuration) * 100);

      // Update current step
      let cumulativeDuration = 0;
      for (let i = 0; i < steps.length; i++) {
        cumulativeDuration += steps[i].duration;
        if (elapsed < cumulativeDuration) {
          setCurrentStep(i);
          break;
        }
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Icon and label */}
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-full p-3 animate-pulse">
              <CurrentIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{steps[currentStep].label}</h3>
              <p className="text-sm text-muted-foreground">
                Isso pode levar alguns segundos...
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Etapa {currentStep + 1} de {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Step indicators */}
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1 p-2 rounded transition-all ${
                    i === currentStep
                      ? 'bg-primary/10 text-primary'
                      : i < currentStep
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-background text-muted-foreground/50'
                  }`}
                >
                  <StepIcon className="h-4 w-4" />
                  <span className="text-xs text-center leading-tight">
                    {step.label.split('...')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}