import { Swords, Trophy, Zap, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CompetitiveAnalysisCardProps {
  analysis: {
    key_competitors: string[];
    differentiation: string;
    competitive_advantages: string[];
    rationale: string;
  };
}

export function CompetitiveAnalysisCard({ analysis }: CompetitiveAnalysisCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="w-5 h-5" />
          Análise Competitiva
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-primary/50 bg-primary/5">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>Por quê essa diferenciação funciona:</strong> {analysis.rationale}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">Principais Concorrentes</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.key_competitors.map((competitor, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {competitor}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Como se Diferenciar</h4>
            </div>
            <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
              {analysis.differentiation}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Vantagens Competitivas</h4>
            </div>
            <ul className="space-y-2">
              {analysis.competitive_advantages.map((advantage, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-0.5 text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{advantage}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
