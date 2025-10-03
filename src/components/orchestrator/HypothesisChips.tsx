import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";

interface Props {
  hypotheses: any[];
  approvedHypotheses: any[];
  setApprovedHypotheses: (hyps: any[]) => void;
  onTest: () => void;
  loading: boolean;
}

export default function HypothesisChips({
  hypotheses,
  approvedHypotheses,
  setApprovedHypotheses,
  onTest,
  loading
}: Props) {
  const toggleHypothesis = (hyp: any) => {
    const isApproved = approvedHypotheses.some(h => h.hypothesis === hyp.hypothesis);
    if (isApproved) {
      setApprovedHypotheses(approvedHypotheses.filter(h => h.hypothesis !== hyp.hypothesis));
    } else {
      setApprovedHypotheses([...approvedHypotheses, hyp]);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Passo 3: Hipóteses</h2>
        </div>
        <div className="text-sm text-muted-foreground">
          {approvedHypotheses.length} aprovadas
        </div>
      </div>

      <div className="space-y-2">
        {hypotheses.map((hyp, idx) => {
          const isApproved = approvedHypotheses.some(h => h.hypothesis === hyp.hypothesis);
          
          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isApproved 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                  : 'border-muted hover:border-primary'
              }`}
              onClick={() => toggleHypothesis(hyp)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {isApproved ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-medium">{hyp.hypothesis}</p>
                  {hyp.evidence_needed && (
                    <p className="text-sm text-muted-foreground">
                      Evidência necessária: {hyp.evidence_needed}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Badge variant={hyp.priority === 'high' ? 'default' : 'secondary'}>
                      {hyp.priority || 'medium'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        onClick={onTest}
        disabled={loading || approvedHypotheses.length === 0}
        className="w-full"
        size="lg"
      >
        {loading ? 'Testando...' : `Testar ${approvedHypotheses.length} Hipótese(s)`}
      </Button>
    </Card>
  );
}