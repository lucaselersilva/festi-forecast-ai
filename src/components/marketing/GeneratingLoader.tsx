import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Users, Lightbulb, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

const steps = [
  { label: "Analisando histórico de eventos...", progress: 25, icon: TrendingUp },
  { label: "Identificando clusters comportamentais...", progress: 50, icon: Users },
  { label: "Gerando estratégias personalizadas...", progress: 75, icon: Lightbulb },
  { label: "Finalizando plano de marketing...", progress: 100, icon: CheckCircle2 },
];

export function GeneratingLoader() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CurrentIcon className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <Loader2 className="w-24 h-24 absolute -top-2 -left-2 text-primary/20 animate-spin" />
        </div>

        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Gerando Plano de Marketing</h3>
            <p className="text-sm text-muted-foreground">{steps[currentStep].label}</p>
          </div>

          <Progress value={steps[currentStep].progress} className="h-2" />

          <div className="space-y-2 pt-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                    isCurrent
                      ? "bg-primary/5 text-primary"
                      : isCompleted
                      ? "text-muted-foreground"
                      : "text-muted-foreground/40"
                  }`}
                >
                  <StepIcon className="w-4 h-4" />
                  <span className="text-sm">{step.label}</span>
                  {isCompleted && <CheckCircle2 className="w-4 h-4 ml-auto text-green-500" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
