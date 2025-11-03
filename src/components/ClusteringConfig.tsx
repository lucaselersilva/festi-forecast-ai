import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings, Play } from "lucide-react";

interface ClusteringConfigProps {
  method: 'kmeans' | 'dbscan' | 'gmm';
  params: {
    k?: number;
    eps?: number;
    minSamples?: number;
    nComponents?: number;
    standardize?: boolean;
    randomState?: number;
  };
  onMethodChange: (method: 'kmeans' | 'dbscan' | 'gmm') => void;
  onParamChange: (key: string, value: any) => void;
  onRun: () => void;
  isLoading?: boolean;
}

export function ClusteringConfig({ 
  method, 
  params, 
  onMethodChange, 
  onParamChange, 
  onRun,
  isLoading = false 
}: ClusteringConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração de Segmentação
        </CardTitle>
        <CardDescription>
          Configure os parâmetros do algoritmo de segmentação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="method">Método</Label>
          <Select value={method} onValueChange={onMethodChange}>
            <SelectTrigger id="method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kmeans">K-Means</SelectItem>
              <SelectItem value="dbscan">DBSCAN</SelectItem>
              <SelectItem value="gmm">GMM (Gaussian Mixture)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {method === 'kmeans' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="k">Número de Clusters (k)</Label>
              <Input
                id="k"
                type="number"
                min={2}
                max={10}
                value={params.k || 4}
                onChange={(e) => onParamChange('k', parseInt(e.target.value))}
              />
            </div>
          </>
        )}

        {method === 'dbscan' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="eps">Epsilon (eps)</Label>
              <Input
                id="eps"
                type="number"
                step={0.1}
                min={0.1}
                max={5}
                value={params.eps || 0.6}
                onChange={(e) => onParamChange('eps', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minSamples">Min Samples</Label>
              <Input
                id="minSamples"
                type="number"
                min={2}
                max={50}
                value={params.minSamples || 10}
                onChange={(e) => onParamChange('minSamples', parseInt(e.target.value))}
              />
            </div>
          </>
        )}

        {method === 'gmm' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="nComponents">Número de Componentes</Label>
              <Input
                id="nComponents"
                type="number"
                min={2}
                max={10}
                value={params.nComponents || 4}
                onChange={(e) => onParamChange('nComponents', parseInt(e.target.value))}
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="standardize">Normalizar Features</Label>
          <Switch
            id="standardize"
            checked={params.standardize ?? true}
            onCheckedChange={(checked) => onParamChange('standardize', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="randomState">Random State</Label>
          <Input
            id="randomState"
            type="number"
            min={0}
            max={9999}
            value={params.randomState || 42}
            onChange={(e) => onParamChange('randomState', parseInt(e.target.value))}
          />
        </div>

        <Button 
          onClick={onRun} 
          className="w-full" 
          disabled={isLoading}
        >
          <Play className="mr-2 h-4 w-4" />
          {isLoading ? 'Processando...' : 'Rodar Segmentação'}
        </Button>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Como funciona:</strong>
            {method === 'kmeans' && ' K-Means agrupa dados minimizando variância intra-cluster. Ideal para clusters esféricos e balanceados.'}
            {method === 'dbscan' && ' DBSCAN identifica clusters por densidade, permitindo formas arbitrárias e detectando outliers automaticamente.'}
            {method === 'gmm' && ' GMM modela clusters como misturas Gaussianas, permitindo clusters sobrepostos e probabilidades de pertencimento.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
