import { Hash, Lightbulb, Search, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface KeywordsCardProps {
  keywords: {
    seo_keywords: string[];
    hashtags: string[];
    paid_keywords: string[];
    rationale: string;
  };
}

export function KeywordsCard({ keywords }: KeywordsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="w-5 h-5" />
          Palavras-Chave Estratégicas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-primary/50 bg-primary/5">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>Por quê?</strong> {keywords.rationale}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">SEO & Landing Pages</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.seo_keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Hashtags (Redes Sociais)</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.hashtags.map((hashtag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  #{hashtag}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Anúncios Pagos</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.paid_keywords.map((keyword, index) => (
                <Badge key={index} className="text-xs bg-gradient-to-r from-primary to-primary/70">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
