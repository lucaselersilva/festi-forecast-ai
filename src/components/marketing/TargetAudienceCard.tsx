import { Target, Users, Heart, AlertCircle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TargetAudienceCardProps {
  audience: {
    demographics: string;
    psychographics: string;
    pain_points: string[];
    desires: string[];
    rationale: string;
  };
}

export function TargetAudienceCard({ audience }: TargetAudienceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Público-Alvo Detalhado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-primary/50 bg-primary/5">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>Por quê focar neste público:</strong> {audience.rationale}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Demografia</h4>
            </div>
            <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
              {audience.demographics}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Psicografia</h4>
            </div>
            <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
              {audience.psychographics}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <h4 className="font-semibold text-sm">Dores & Necessidades</h4>
            </div>
            <ul className="space-y-1">
              {audience.pain_points.map((point, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Desejos & Aspirações</h4>
            </div>
            <ul className="space-y-1">
              {audience.desires.map((desire, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{desire}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
