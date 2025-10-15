import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZigImport } from "@/components/zigcasas/ZigImport";
import { ZigClusters } from "@/components/zigcasas/ZigClusters";
import { ZigReactivation } from "@/components/zigcasas/ZigReactivation";
import { Database, Upload, Target } from "lucide-react";

export default function ZigCasas() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Zig Casas
          </h1>
          <p className="text-muted-foreground mt-2">
            Análise comportamental e reativação de clientes
          </p>
        </div>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar Dados
          </TabsTrigger>
          <TabsTrigger value="clusters" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Clusters
          </TabsTrigger>
          <TabsTrigger value="reactivation" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Reativação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6">
          <ZigImport onImportComplete={handleImportComplete} />
        </TabsContent>

        <TabsContent value="clusters" className="mt-6">
          <ZigClusters key={refreshKey} />
        </TabsContent>

        <TabsContent value="reactivation" className="mt-6">
          <ZigReactivation key={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
