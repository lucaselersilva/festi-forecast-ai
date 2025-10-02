import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Calendar, TrendingUp, Users, DollarSign, Target, FileText, Download, BarChart3, PieChart, Activity, Settings, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { ClusteringConfig } from "@/components/ClusteringConfig";
import { ClusterQuality } from "@/components/ClusterQuality";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from "axios";

interface RevenueAnalysis {
  revenueProjection: {
    totalRevenue: number;
    totalSales: number;
    avgTicketPrice: number;
    occupancyRate: number;
    revenuePerSeat: number;
  };
  pricingTiers: Array<{
    tier: string;
    percentage: number;
    capacity: number;
    price: number;
    expectedSales: number;
    revenue: number;
    conversionRate: number;
    segmentTarget: string;
  }>;
  scenarioAnalysis: Array<{
    scenario: string;
    description: string;
    totalRevenue: number;
    totalSales: number;
    occupancyRate: number;
    avgTicketPrice: number;
    revenuePerSeat: number;
  }>;
  competitiveInsights: {
    marketPosition: string;
    priceAdvantage: number;
    occupancyBenchmark: number;
    competitorCount: number;
  };
  recommendations: string[];
  marketingROI: {
    recommendedBudget: number;
    channelMix: { digital: number; traditional: number; influencers: number };
    expectedCPA: number;
    breakeven: number;
  };
  dataQuality: {
    historicalEvents: number;
    segments: number;
    confidence: string;
  };
}

interface SponsorshipForecast {
  audience: {
    Heavy?: { expectedAudience: number; expectedSpend: number; conversionRate: number; confidence: string };
    Medium?: { expectedAudience: number; expectedSpend: number; conversionRate: number; confidence: string };
    Light?: { expectedAudience: number; expectedSpend: number; conversionRate: number; confidence: string };
  };
  expectedReach: number;
  expectedOnsiteSpend: number;
  profileHints: {
    avgAge: number;
    genderSplit: { male: number; female: number; other: number };
    topCities: string[];
    segments: { Heavy: number; Medium: number; Light: number };
  };
  sponsorPackages: Array<{
    tier: string;
    price: number;
    benefits: string[];
    roiHint: string;
    expectedROI: string;
    activationSuggestions: string[];
  }>;
  salesNarrative: string[];
  insights: string[];
  dataQuality: string;
  uncertainty: {
    reachRange: { min: number; max: number };
    spendRange: { min: number; max: number };
  };
}

interface AdvancedSegment {
  id: string;
  name: string;
  description: string;
  marketShare: number;
  projectedAttendance: number;
  avgTicketSpend: number;
  avgBarSpend: number;
  conversionRate: number;
  characteristics: string[];
  marketingChannels: { [key: string]: number };
  messaging: string[];
}

export default function InsightsPlanner() {
  const [activeTab, setActiveTab] = useState("revenue");
  const [loading, setLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenueAnalysis | null>(null);
  const [sponsorshipData, setSponsorshipData] = useState<SponsorshipForecast | null>(null);
  const [advancedSegments, setAdvancedSegments] = useState<AdvancedSegment[]>([]);
  
  // Clustering state
  const [clusteringMethod, setClusteringMethod] = useState<'kmeans' | 'dbscan' | 'gmm'>('kmeans');
  const [clusteringParams, setClusteringParams] = useState({
    k: 4,
    eps: 0.6,
    minSamples: 10,
    nComponents: 4,
    standardize: true,
    randomState: 42,
  });
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [clusteringResult, setClusteringResult] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    genre: "",
    city: "",
    targetRevenue: "",
    capacity: "",
    date: "",
    sponsorBudget: "",
  });

  const [segmentationSettings, setSegmentationSettings] = useState({
    enabled: false,
    ageGroups: true,
    frequencyTiers: true,
    consumptionLevels: true,
    genderSegments: false,
  });

  const { toast } = useToast();

  // Opções para os selects
  const genres = ["Rock", "Eletrônica", "Funk", "Sertanejo", "Pop", "Forró", "MPB", "Rap", "Indie", "Pagode"];
  const cities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Salvador", "Fortaleza", "Recife", "Brasília", "Florianópolis"];

  const handleCompleteAnalysis = async () => {
    if (!formData.genre || !formData.city) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione pelo menos o gênero e a cidade do evento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("🚀 Starting complete analysis...");

      const requestData = {
        genre: formData.genre,
        city: formData.city,
        targetRevenue: formData.targetRevenue ? parseFloat(formData.targetRevenue) : 500000,
        capacity: formData.capacity ? parseInt(formData.capacity) : 5000,
        date: formData.date || new Date().toISOString().split('T')[0],
        sponsorBudget: formData.sponsorBudget ? parseFloat(formData.sponsorBudget) : 150000,
      };

      // Step 1: Generate advanced segmentation if enabled
      let segmentData = [];
      if (segmentationSettings.enabled) {
        console.log("🎯 Generating advanced segmentation...");
        const segmentResponse = await supabase.functions.invoke('advanced-segmentation', {
          body: {
            ...requestData,
            customFactors: segmentationSettings
          }
        });

        if (segmentResponse.data?.success) {
          segmentData = segmentResponse.data.segments;
          setAdvancedSegments(segmentData);
          console.log("✅ Advanced segments generated:", segmentData.length);
        }
      }

      // Step 2: Generate revenue analysis (using mock data enhanced with segments)
      const revenueResult = generateEnhancedRevenueData(requestData, segmentData);
      setRevenueData(revenueResult);

      // Step 3: Generate sponsorship analysis
      console.log("📊 Generating sponsorship forecast...");
      const sponsorshipResponse = await supabase.functions.invoke('sponsorship-forecast', {
        body: requestData
      });

      if (sponsorshipResponse.error) {
        throw new Error(sponsorshipResponse.error.message || "Erro na análise de patrocínio");
      }

      const sponsorshipResult = sponsorshipResponse.data;
      if (sponsorshipResult.success) {
        const transformedData = transformSponsorshipData(sponsorshipResult, formData, segmentData);
        setSponsorshipData(transformedData);
      }

      toast({
        title: "Análise completa realizada!",
        description: `Plano gerado com ${segmentationSettings.enabled ? 'segmentação avançada' : 'segmentação padrão'}`,
      });

      // Auto-navigate to Revenue tab to show results
      setActiveTab("revenue");

    } catch (error) {
      console.error("Complete analysis error:", error);
      toast({
        title: "Erro na análise", 
        description: error instanceof Error ? error.message : "Falha ao gerar análise completa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "pdf") => {
    if (!revenueData && !sponsorshipData) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Gere uma análise completa primeiro",
        variant: "destructive",
      });
      return;
    }

    // Show loading toast
    const loadingToast = toast({
      title: `🔄 Gerando relatório ${format.toUpperCase()}...`,
      description: "Aguarde enquanto processamos seus dados",
    });

    try {
      console.log("📄 Exporting report in format:", format);
      
      const exportData = {
        eventInfo: {
          genre: formData.genre,
          city: formData.city,
          date: formData.date,
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
          targetRevenue: formData.targetRevenue ? parseFloat(formData.targetRevenue) : undefined,
        },
        revenueData,
        sponsorshipData,
        segments: advancedSegments,
        segmentationSettings,
      };

      const response = await supabase.functions.invoke('export-report', {
        body: { format, data: exportData }
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to export report");
      }

      if (format === "csv" && response.data) {
        // Handle CSV download
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `insights-report-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (format === "pdf" && response.data) {
        // Handle PDF download - response.data.data is base64 encoded PDF
        const pdfData = response.data.data || response.data;
        const binaryString = atob(pdfData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `insights-report-${Date.now()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: `✅ Relatório ${format.toUpperCase()} gerado!`,
        description: "Download iniciado automaticamente. Verifique sua pasta de downloads.",
      });

    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "❌ Erro no export",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    }
  };

  const handleRunClustering = async () => {
    setClusteringLoading(true);
    try {
      console.log("🔬 Running clustering with method:", clusteringMethod);
      
      const response = await supabase.functions.invoke('clustering', {
        body: {
          method: clusteringMethod,
          params: clusteringParams,
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao executar clustering");
      }

      if (response.data.success) {
        setClusteringResult(response.data);
        toast({
          title: "Clustering concluído!",
          description: `${response.data.clusters.length} clusters identificados com ${response.data.totalCustomers} clientes`,
        });
      }
    } catch (error) {
      console.error("Clustering error:", error);
      toast({
        title: "Erro no clustering",
        description: error instanceof Error ? error.message : "Falha ao executar algoritmo",
        variant: "destructive",
      });
    } finally {
      setClusteringLoading(false);
    }
  };

  const generateEnhancedRevenueData = (requestData: any, segments: AdvancedSegment[]): RevenueAnalysis => {
    const baseRevenue = requestData.targetRevenue;
    const baseCapacity = requestData.capacity;

    // Enhanced pricing tiers based on segments
    const pricingTiers = segments.length > 0 ? 
      segments.slice(0, 4).map((segment, index) => ({
        tier: segment.name.split(' ')[0],
        percentage: Math.round(segment.marketShare * 100),
        capacity: segment.projectedAttendance,
        price: segment.avgTicketSpend,
        expectedSales: Math.floor(segment.projectedAttendance * segment.conversionRate),
        revenue: Math.floor(segment.projectedAttendance * segment.conversionRate * segment.avgTicketSpend),
        conversionRate: segment.conversionRate,
        segmentTarget: segment.name
      })) :
      // Default tiers if no advanced segmentation
      [
        {
          tier: "VIP",
          percentage: 10,
          capacity: Math.floor(baseCapacity * 0.1),
          price: Math.round(baseRevenue / (baseCapacity * 0.8) * 2.5),
          expectedSales: Math.floor(baseCapacity * 0.1 * 0.6),
          revenue: Math.floor(baseCapacity * 0.1 * 0.6) * Math.round(baseRevenue / (baseCapacity * 0.8) * 2.5),
          conversionRate: 0.6,
          segmentTarget: "Champions"
        },
        {
          tier: "Premium",
          percentage: 25,
          capacity: Math.floor(baseCapacity * 0.25),
          price: Math.round(baseRevenue / (baseCapacity * 0.8) * 1.5),
          expectedSales: Math.floor(baseCapacity * 0.25 * 0.75),
          revenue: Math.floor(baseCapacity * 0.25 * 0.75) * Math.round(baseRevenue / (baseCapacity * 0.8) * 1.5),
          conversionRate: 0.75,
          segmentTarget: "Loyal"
        },
        {
          tier: "Standard",
          percentage: 50,
          capacity: Math.floor(baseCapacity * 0.5),
          price: Math.round(baseRevenue / (baseCapacity * 0.8)),
          expectedSales: Math.floor(baseCapacity * 0.5 * 0.85),
          revenue: Math.floor(baseCapacity * 0.5 * 0.85) * Math.round(baseRevenue / (baseCapacity * 0.8)),
          conversionRate: 0.85,
          segmentTarget: "Potential"
        },
        {
          tier: "Early Bird",
          percentage: 15,
          capacity: Math.floor(baseCapacity * 0.15),
          price: Math.round(baseRevenue / (baseCapacity * 0.8) * 0.7),
          expectedSales: Math.floor(baseCapacity * 0.15 * 0.9),
          revenue: Math.floor(baseCapacity * 0.15 * 0.9) * Math.round(baseRevenue / (baseCapacity * 0.8) * 0.7),
          conversionRate: 0.9,
          segmentTarget: "New"
        }
      ];

    const totalSales = pricingTiers.reduce((sum, tier) => sum + tier.expectedSales, 0);
    const totalRevenue = pricingTiers.reduce((sum, tier) => sum + tier.revenue, 0);

    return {
      revenueProjection: {
        totalRevenue: totalRevenue,
        totalSales: totalSales,
        avgTicketPrice: Math.round(totalRevenue / totalSales),
        occupancyRate: totalSales / baseCapacity,
        revenuePerSeat: Math.round(totalRevenue / baseCapacity)
      },
      pricingTiers,
      scenarioAnalysis: [
        {
          scenario: "Conservative",
          description: "Preços 10% abaixo para maximizar ocupação",
          totalRevenue: Math.round(totalRevenue * 0.9),
          totalSales: Math.floor(baseCapacity * 0.9),
          occupancyRate: 0.9,
          avgTicketPrice: Math.round(totalRevenue * 0.9 / (baseCapacity * 0.9)),
          revenuePerSeat: Math.round(totalRevenue * 0.9 / baseCapacity)
        },
        {
          scenario: "Aggressive",
          description: "Preços 20% acima para maximizar receita por ingresso",
          totalRevenue: Math.round(totalRevenue * 1.1),
          totalSales: Math.floor(baseCapacity * 0.65),
          occupancyRate: 0.65,
          avgTicketPrice: Math.round(totalRevenue * 1.1 / (baseCapacity * 0.65)),
          revenuePerSeat: Math.round(totalRevenue * 1.1 / baseCapacity)
        },
        {
          scenario: "Optimal",
          description: "Preços otimizados com base na segmentação",
          totalRevenue: Math.round(totalRevenue),
          totalSales: totalSales,
          occupancyRate: totalSales / baseCapacity,
          avgTicketPrice: Math.round(totalRevenue / totalSales),
          revenuePerSeat: Math.round(totalRevenue / baseCapacity)
        }
      ],
      competitiveInsights: {
        marketPosition: "Market Rate",
        priceAdvantage: segments.length > 0 ? 8 : 5,
        occupancyBenchmark: segments.length > 0 ? 110 : 100,
        competitorCount: 3
      },
      recommendations: [
        `Preço médio recomendado: R$ ${Math.round(totalRevenue / totalSales).toLocaleString('pt-BR')}`,
        `Meta de ocupação: ${Math.round((totalSales / baseCapacity) * 100)}% (${totalSales.toLocaleString('pt-BR')} ingressos)`,
        `Receita projetada: R$ ${totalRevenue.toLocaleString('pt-BR')}`,
        segments.length > 0 ? "Segmentação avançada ativada - estratégias direcionadas por micro-público" : "Considere ativar segmentação avançada para melhor targeting",
        "Implementar early bird para aumentar conversão inicial",
        segments.length > 0 ? "Usar canais de marketing específicos por segmento" : "Diversificar canais de marketing"
      ],
      marketingROI: {
        recommendedBudget: Math.round(totalRevenue * (segments.length > 0 ? 0.12 : 0.15)),
        channelMix: segments.length > 0 ? 
          { digital: 70, traditional: 20, influencers: 10 } : 
          { digital: 60, traditional: 25, influencers: 15 },
        expectedCPA: Math.round((totalRevenue * 0.15) / totalSales),
        breakeven: Math.round(totalSales * 0.7)
      },
      dataQuality: {
        historicalEvents: 5,
        segments: segments.length > 0 ? segments.length : 4,
        confidence: segments.length > 0 ? "Alta" : "Média"
      }
    };
  };

  const transformSponsorshipData = (sponsorshipResult: any, formData: any, segments: AdvancedSegment[]): SponsorshipForecast => {
    return {
      audience: {
        Heavy: { 
          expectedAudience: Math.floor(sponsorshipResult.predictions.expectedAttendance * 0.3), 
          expectedSpend: segments.length > 0 ? Math.round(segments[0]?.avgBarSpend || 300) : 300, 
          conversionRate: 0.8, 
          confidence: "alta" 
        },
        Medium: { 
          expectedAudience: Math.floor(sponsorshipResult.predictions.expectedAttendance * 0.5), 
          expectedSpend: segments.length > 0 ? Math.round(segments[1]?.avgBarSpend || 200) : 200, 
          conversionRate: 0.6, 
          confidence: "média" 
        },
        Light: { 
          expectedAudience: Math.floor(sponsorshipResult.predictions.expectedAttendance * 0.2), 
          expectedSpend: segments.length > 0 ? Math.round(segments[2]?.avgBarSpend || 100) : 100, 
          conversionRate: 0.4, 
          confidence: "baixa" 
        }
      },
      expectedReach: sponsorshipResult.predictions.expectedAttendance,
      expectedOnsiteSpend: sponsorshipResult.predictions.expectedAttendance * (segments.length > 0 ? 175 : 150),
      profileHints: {
        avgAge: 28,
        genderSplit: { male: 0.55, female: 0.43, other: 0.02 },
        topCities: [formData.city],
        segments: { Heavy: 30, Medium: 50, Light: 20 }
      },
      sponsorPackages: [
        {
          tier: "Bronze",
          price: segments.length > 0 ? 60000 : 50000,
          benefits: ["Logo no evento", "Menção nas redes sociais"],
          roiHint: segments.length > 0 ? "3.5x ROI com targeting avançado" : "3x ROI estimado",
          expectedROI: segments.length > 0 ? "210k" : "150k",
          activationSuggestions: ["Stand promocional", "Sampling direcionado"]
        },
        {
          tier: "Prata", 
          price: segments.length > 0 ? 120000 : 100000,
          benefits: ["Logo destacado", "Ativação no local", "Posts dedicados", "Acesso a dados de audiência"],
          roiHint: segments.length > 0 ? "4.5x ROI com micro-targeting" : "4x ROI estimado",
          expectedROI: segments.length > 0 ? "540k" : "400k", 
          activationSuggestions: ["Experiência imersiva", "Concurso cultural", "Ativação por segmento"]
        },
        {
          tier: "Ouro",
          price: segments.length > 0 ? 200000 : 180000,
          benefits: ["Naming rights", "Ativação premium", "Campanha integrada", "Relatório detalhado pós-evento", "Acesso exclusivo VIP"],
          roiHint: segments.length > 0 ? "5.2x ROI com estratégia omnichannel" : "4.8x ROI estimado",
          expectedROI: segments.length > 0 ? "1.04M" : "864k",
          activationSuggestions: ["Campanha 360°", "Experiência VIP", "Content co-creation", "Retargeting pós-evento"]
        }
      ],
      salesNarrative: [
        ...sponsorshipResult.insights.recommendations,
        ...(segments.length > 0 ? [
          `Segmentação avançada identifica ${segments.length} micro-públicos específicos`,
          "ROI 15-25% superior com targeting direcionado por segmento",
          "Métricas de conversão detalhadas por perfil de consumidor"
        ] : [])
      ],
      insights: [
        ...sponsorshipResult.insights.recommendations,
        ...(segments.length > 0 ? [
          "Segmentação avançada ativa permite estratégias direcionadas",
          "Oportunidade de ativações específicas por micro-público",
          "Potencial de cross-sell e upsell identificado por segmento"
        ] : [])
      ],
      dataQuality: segments.length > 0 ? "alta" : (sponsorshipResult.predictions.revenueConfidence > 0.7 ? "alta" : "média"),
      uncertainty: {
        reachRange: { 
          min: Math.floor(sponsorshipResult.predictions.expectedAttendance * 0.85), 
          max: Math.floor(sponsorshipResult.predictions.expectedAttendance * 1.15) 
        },
        spendRange: { 
          min: Math.floor(sponsorshipResult.predictions.expectedAttendance * (segments.length > 0 ? 140 : 120)), 
          max: Math.floor(sponsorshipResult.predictions.expectedAttendance * (segments.length > 0 ? 210 : 180)) 
        }
      }
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Insights Planner</h1>
          <p className="text-muted-foreground">
            Planejamento inteligente de receita e estratégias de patrocínio
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Plano de Receita
          </TabsTrigger>
          <TabsTrigger value="sponsorship" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Patrocínio
          </TabsTrigger>
          <TabsTrigger value="clustering" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Clustering
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          {/* Configuração Principal do Evento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração do Evento
              </CardTitle>
              <CardDescription>
                Configure os detalhes do evento para gerar o plano completo de receita e patrocínio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="genre">Gênero Musical *</Label>
                  <Select value={formData.genre} onValueChange={(value) => setFormData({...formData, genre: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Select value={formData.city} onValueChange={(value) => setFormData({...formData, city: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidade</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="5000"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetRevenue">Meta de Receita (R$)</Label>
                  <Input
                    id="targetRevenue"
                    type="number"
                    placeholder="500000"
                    value={formData.targetRevenue}
                    onChange={(e) => setFormData({...formData, targetRevenue: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data do Evento</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sponsorBudget">Orçamento Patrocínio (R$)</Label>
                  <Input
                    id="sponsorBudget"
                    type="number"
                    placeholder="150000"
                    value={formData.sponsorBudget}
                    onChange={(e) => setFormData({...formData, sponsorBudget: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segmentação Avançada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Segmentação Avançada
                <Badge variant="secondary">Beta</Badge>
              </CardTitle>
              <CardDescription>
                Ative micro-segmentação para estratégias direcionadas e ROI otimizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">Ativar Segmentação Personalizada</div>
                  <div className="text-sm text-muted-foreground">
                    Gera até 8 micro-segmentos baseados em RFM + fatores customizados
                  </div>
                </div>
                <Switch
                  checked={segmentationSettings.enabled}
                  onCheckedChange={(checked) => 
                    setSegmentationSettings({...segmentationSettings, enabled: checked})
                  }
                />
              </div>

              {segmentationSettings.enabled && (
                <div className="pt-4 border-t space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ageGroups"
                        checked={segmentationSettings.ageGroups}
                        onCheckedChange={(checked) =>
                          setSegmentationSettings({...segmentationSettings, ageGroups: checked})
                        }
                      />
                      <Label htmlFor="ageGroups" className="text-sm">Faixas Etárias</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="frequencyTiers"
                        checked={segmentationSettings.frequencyTiers}
                        onCheckedChange={(checked) =>
                          setSegmentationSettings({...segmentationSettings, frequencyTiers: checked})
                        }
                      />
                      <Label htmlFor="frequencyTiers" className="text-sm">Frequência</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="consumptionLevels"
                        checked={segmentationSettings.consumptionLevels}
                        onCheckedChange={(checked) =>
                          setSegmentationSettings({...segmentationSettings, consumptionLevels: checked})
                        }
                      />
                      <Label htmlFor="consumptionLevels" className="text-sm">Consumo</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="genderSegments"
                        checked={segmentationSettings.genderSegments}
                        onCheckedChange={(checked) =>
                          setSegmentationSettings({...segmentationSettings, genderSegments: checked})
                        }
                      />
                      <Label htmlFor="genderSegments" className="text-sm">Gênero</Label>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Benefícios da Segmentação Avançada:</div>
                    <ul className="text-xs text-blue-700 dark:text-blue-200 mt-1 space-y-0.5">
                      <li>• ROI de marketing 15-25% superior</li>
                      <li>• Estratégias de preço otimizadas por público</li>
                      <li>• Ativações de patrocínio direcionadas</li>
                      <li>• Canais de marketing específicos por segmento</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão de Geração */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center">
                <Button 
                  onClick={handleCompleteAnalysis}
                  disabled={loading || !formData.genre || !formData.city}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Gerando Plano Completo...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4" />
                      Gerar Plano Completo (Receita + Patrocínio)
                    </>
                  )}
                </Button>
              </div>
              <div className="text-center text-sm text-muted-foreground mt-2">
                * Campos obrigatórios: Gênero e Cidade
              </div>
            </CardContent>
          </Card>

          {/* Resultados de Receita */}
          {revenueData ? (
            <div className="space-y-6">
              {/* Resumo Executivo de Receita */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Projeção de Receita
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={revenueData.dataQuality.confidence === "Alta" ? "default" : 
                                   revenueData.dataQuality.confidence === "Média" ? "secondary" : "outline"}>
                      Confiança: {revenueData.dataQuality.confidence}
                    </Badge>
                    <Badge variant="outline">
                      {revenueData.dataQuality.segments} segmentos
                    </Badge>
                    {advancedSegments.length > 0 && (
                      <Badge variant="default" className="bg-blue-600">
                        Segmentação Avançada
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        R$ {revenueData.revenueProjection.totalRevenue.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">Receita Total</div>
                    </div>

                    <div className="text-center p-4 bg-green-500/5 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {revenueData.revenueProjection.totalSales.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">Ingressos Vendidos</div>
                    </div>

                    <div className="text-center p-4 bg-blue-500/5 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        R$ {revenueData.revenueProjection.avgTicketPrice.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">Preço Médio</div>
                    </div>

                    <div className="text-center p-4 bg-orange-500/5 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(revenueData.revenueProjection.occupancyRate * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Taxa de Ocupação</div>
                    </div>

                    <div className="text-center p-4 bg-purple-500/5 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        R$ {revenueData.revenueProjection.revenuePerSeat.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">Receita por Assento</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Segmentos Avançados (se disponível) */}
              {advancedSegments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Micro-Segmentos Identificados
                    </CardTitle>
                    <CardDescription>
                      Segmentação personalizada baseada nos fatores selecionados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {advancedSegments.slice(0, 6).map((segment) => (
                        <Card key={segment.id} className="bg-gradient-to-br from-background to-muted/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{segment.name}</CardTitle>
                            <CardDescription className="text-xs">{segment.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Participação:</span>
                              <span className="font-medium">{(segment.marketShare * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Público:</span>
                              <span className="font-medium">{segment.projectedAttendance.toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Ticket Médio:</span>
                              <span className="font-medium text-green-600">R$ {segment.avgTicketSpend}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Conversão:</span>
                              <span className="font-medium">{(segment.conversionRate * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={segment.conversionRate * 100} className="mt-2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pricing Tiers, Scenario Analysis, etc. */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Estratégia de Preços por Categoria
                  </CardTitle>
                  <CardDescription>
                    {advancedSegments.length > 0 ? 
                      "Mix otimizado baseado em micro-segmentos avançados" : 
                      "Mix otimizado de ingressos para maximizar receita e ocupação"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {revenueData.pricingTiers.map((tier, index) => (
                      <Card key={`tier-${tier.tier}-${index}`} className="bg-gradient-to-br from-background to-muted/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center justify-between">
                            {tier.tier}
                            <Badge variant="secondary">{tier.percentage}%</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <div className="text-xl font-bold text-primary">R$ {tier.price.toLocaleString('pt-BR')}</div>
                            <div className="text-sm text-muted-foreground">preço por ingresso</div>
                          </div>
                          
                          <div>
                            <div className="text-lg font-semibold">{tier.expectedSales.toLocaleString('pt-BR')}</div>
                            <div className="text-sm text-muted-foreground">vendas esperadas</div>
                            <Progress value={tier.conversionRate * 100} className="mt-1" />
                            <div className="text-xs text-muted-foreground mt-1">
                              {Math.round(tier.conversionRate * 100)}% conversão
                            </div>
                          </div>

                          <div>
                            <div className="text-lg font-semibold text-green-600">
                              R$ {tier.revenue.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-sm text-muted-foreground">receita do tier</div>
                          </div>

                          <Badge variant="outline" className="w-full justify-center">
                            Alvo: {tier.segmentTarget}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Export Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Exportar Relatório Completo
                  </CardTitle>
                  <CardDescription>
                    Baixe o plano completo com dados de receita e patrocínio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => handleExport("csv")}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Exportar CSV
                    </Button>
                    <Button 
                      onClick={() => handleExport("pdf")}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Gerar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Marketing ROI & Strategy Insights */}
              {revenueData.marketingROI && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Estratégia de Marketing & ROI
                    </CardTitle>
                    <CardDescription>
                      Investimento otimizado com retorno projetado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                          <div className="text-sm text-muted-foreground">Orçamento Recomendado</div>
                          <div className="text-2xl font-bold text-primary">
                            R$ {revenueData.marketingROI.recommendedBudget.toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 bg-muted/50 rounded">
                            <div className="text-xs text-muted-foreground">CPA Esperado</div>
                            <div className="font-semibold">R$ {revenueData.marketingROI.expectedCPA}</div>
                          </div>
                          <div className="p-3 bg-muted/50 rounded">
                            <div className="text-xs text-muted-foreground">Break-even</div>
                            <div className="font-semibold">{revenueData.marketingROI.breakeven} ingressos</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-3">Mix de Canais Recomendado</div>
                        <div className="space-y-2">
                          {Object.entries(revenueData.marketingROI.channelMix).map(([channel, percentage]) => (
                            <div key={channel} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{channel}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={percentage as number} className="w-20 h-2" />
                                <span className="text-sm font-medium w-8">{percentage}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Competitive Position */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Posição Competitiva
                  </CardTitle>
                  <CardDescription>
                    Benchmarking com eventos similares na região
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{revenueData.competitiveInsights.marketPosition}</div>
                      <div className="text-sm text-muted-foreground mt-1">Posição no Mercado</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">+{revenueData.competitiveInsights.priceAdvantage}%</div>
                      <div className="text-sm text-muted-foreground mt-1">Vantagem de Preço</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{revenueData.competitiveInsights.occupancyBenchmark}%</div>
                      <div className="text-sm text-muted-foreground mt-1">vs. Benchmark Ocupação</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Customer Prospects */}
              {advancedSegments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Clientes Mais Prováveis
                    </CardTitle>
                    <CardDescription>
                      Perfis com maior probabilidade de conversão baseados em histórico
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {advancedSegments.slice(0, 3).map((segment, index) => {
                        const topChannel = Object.entries(segment.marketingChannels || {})
                          .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'digital';
                        const probability = Math.round(segment.conversionRate * 100);
                        const expectedSpend = segment.avgTicketSpend + segment.avgBarSpend;
                        
                        return (
                          <div key={`prospect-${segment.id}`} className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold">{segment.name}</h4>
                                <Badge variant={probability > 70 ? "default" : probability > 50 ? "secondary" : "outline"}>
                                  {probability}% probabilidade
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{segment.description}</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Gasto Esperado:</span>
                                  <span className="font-medium ml-1">R$ {expectedSpend.toLocaleString('pt-BR')}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Canal Preferido:</span>
                                  <span className="font-medium ml-1 capitalize">{topChannel}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Potencial:</span>
                                  <span className="font-medium ml-1">{segment.projectedAttendance} pessoas</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Recomendações Estratégicas
                  </CardTitle>
                  <CardDescription>
                    Estratégias baseadas na análise para maximizar resultados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {revenueData.recommendations.map((rec, index) => (
                      <li key={`rec-${index}`} className="flex items-start gap-3">
                        <Target className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análise de Receita
                </CardTitle>
                <CardDescription>
                  Configure o evento acima e clique em "Gerar Plano Completo" para ver a análise detalhada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Análise de receita disponível após configurar o evento</p>
                  <p className="text-sm">Inclui: elasticidade de preços, otimização de receita e projeções por segmento</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sponsorship" className="space-y-6">
          {/* Resultados do Patrocínio */}
          {sponsorshipData ? (
            <div className="space-y-6">
              {/* Resumo Executivo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Resumo para Patrocinador
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={sponsorshipData.dataQuality === "alta" ? "default" : 
                                   sponsorshipData.dataQuality === "média" ? "secondary" : "outline"}>
                      Qualidade dos dados: {sponsorshipData.dataQuality}
                    </Badge>
                    {advancedSegments.length > 0 && (
                      <Badge variant="default" className="bg-blue-600">
                        Com Micro-Segmentação
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {sponsorshipData.expectedReach.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">Alcance Esperado</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {sponsorshipData.uncertainty.reachRange.min.toLocaleString('pt-BR')} - {sponsorshipData.uncertainty.reachRange.max.toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-green-500/5 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        R$ {sponsorshipData.expectedOnsiteSpend.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">Consumo On-Site</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        R$ {sponsorshipData.uncertainty.spendRange.min.toLocaleString('pt-BR')} - {sponsorshipData.uncertainty.spendRange.max.toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-blue-500/5 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {sponsorshipData.profileHints.avgAge} anos
                      </div>
                      <div className="text-sm text-muted-foreground">Idade Média</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {Math.round(sponsorshipData.profileHints.genderSplit.male * 100)}% M / {Math.round(sponsorshipData.profileHints.genderSplit.female * 100)}% F
                      </div>
                    </div>

                    <div className="text-center p-4 bg-orange-500/5 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {sponsorshipData.profileHints.topCities?.slice(0, 2).join(", ") || "Nacional"}
                      </div>
                      <div className="text-sm text-muted-foreground">Top Mercados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Segmentos */}
              <Card>
                <CardHeader>
                  <CardTitle>Segmentos de Audiência</CardTitle>
                  <CardDescription>
                    {advancedSegments.length > 0 ? 
                      "Breakdown otimizado com micro-segmentação avançada" :
                      "Breakdown por comportamento de consumo (RFM Analysis)"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(sponsorshipData.audience).map(([segment, data]: [string, any]) => (
                      <Card key={segment} className="bg-gradient-to-br from-background to-muted/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center justify-between">
                            {segment}
                            <Badge variant={data.confidence === "alta" ? "default" : "secondary"}>
                              {data.confidence}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <div className="text-2xl font-bold">{data.expectedAudience.toLocaleString('pt-BR')}</div>
                            <div className="text-sm text-muted-foreground">pessoas esperadas</div>
                          </div>
                          
                          <div>
                            <div className="text-xl font-semibold text-green-600">
                              R$ {data.expectedSpend.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-sm text-muted-foreground">consumo previsto</div>
                          </div>

                          <div>
                            <div className="text-sm font-medium">
                              {(data.conversionRate * 100).toFixed(1)}% conversão
                            </div>
                            <div className="text-xs text-muted-foreground">
                              R$ {Math.round(data.expectedSpend / data.expectedAudience)} por pessoa
                            </div>
                          </div>

                          {segment === "Heavy" && (
                            <div className="text-xs p-2 bg-yellow-500/10 rounded text-yellow-700 dark:text-yellow-300">
                              💎 Segmento premium com LTV 3.2x superior
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pacotes de Patrocínio */}
              <Card>
                <CardHeader>
                  <CardTitle>Pacotes de Patrocínio</CardTitle>
                  <CardDescription>
                    {advancedSegments.length > 0 ? 
                      "Preços otimizados com targeting avançado por micro-segmento" :
                      "Preços sugeridos com base no alcance e receita incremental projetada"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sponsorshipData.sponsorPackages.map((pkg, index) => (
                      <Card key={pkg.tier} className={`relative overflow-hidden ${
                        pkg.tier === "Ouro" ? "border-yellow-500/50 bg-yellow-500/5" :
                        pkg.tier === "Prata" ? "border-gray-400/50 bg-gray-500/5" : 
                        "border-orange-600/50 bg-orange-500/5"
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              {pkg.tier === "Ouro" && "🥇"}
                              {pkg.tier === "Prata" && "🥈"}  
                              {pkg.tier === "Bronze" && "🥉"}
                              Pacote {pkg.tier}
                              {advancedSegments.length > 0 && pkg.tier === "Ouro" && (
                                <Badge variant="secondary" className="text-xs">Premium Targeting</Badge>
                              )}
                            </CardTitle>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                R$ {pkg.price.toLocaleString('pt-BR')}
                              </div>
                              <div className="text-sm text-green-600">ROI: {pkg.expectedROI}</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground font-medium">
                            {pkg.roiHint}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Benefícios Inclusos:</h4>
                              <ul className="text-sm space-y-1">
                                {pkg.benefits.map((benefit, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Sugestões de Ativação:</h4>
                              <ul className="text-sm space-y-1">
                                {pkg.activationSuggestions.map((suggestion, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Insights e Narrativa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Insights Data-Driven
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sponsorshipData.insights.map((insight, index) => (
                        <div key={`insight-${index}`} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Argumentos Executivos
                    </CardTitle>
                    <CardDescription>
                      Narrativa pronta para reunião com patrocinadores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sponsorshipData.salesNarrative.map((narrative, index) => (
                        <div key={`narrative-${index}`} className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg border border-green-500/10">
                          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-sm font-medium">{narrative}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">Configure o evento na aba "Plano de Receita" para gerar insights de patrocínio</p>
                <p className="text-sm text-muted-foreground">
                  Análise baseada em dados reais de RFM, segmentação comportamental e eventos análogos
                </p>
                <Button 
                  onClick={() => setActiveTab("revenue")} 
                  variant="outline" 
                  className="mt-4"
                >
                  Ir para Configuração
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Clustering Tab */}
        <TabsContent value="clustering" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClusteringConfig
              method={clusteringMethod}
              params={clusteringParams}
              onMethodChange={setClusteringMethod}
              onParamChange={(key, value) => 
                setClusteringParams(prev => ({ ...prev, [key]: value }))
              }
              onRun={handleRunClustering}
              isLoading={clusteringLoading}
            />

            {clusteringResult && (
              <ClusterQuality
                silhouetteScore={clusteringResult.metrics.silhouetteScore}
                daviesBouldinScore={clusteringResult.metrics.daviesBouldinScore}
                clusterSizes={clusteringResult.metrics.clusterSizes}
                method={clusteringMethod}
              />
            )}
          </div>

          {clusteringResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clusters Identificados
                </CardTitle>
                <CardDescription>
                  Segmentos de clientes baseados em RFM (Recência, Frequência, Monetário)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cluster</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>% Total</TableHead>
                      <TableHead>Recência Média (dias)</TableHead>
                      <TableHead>Frequência Média</TableHead>
                      <TableHead>Monetário Médio (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clusteringResult.clusters.map((cluster: any) => (
                      <TableRow key={cluster.cluster}>
                        <TableCell>
                          <Badge 
                            variant={cluster.cluster === -1 ? "outline" : "default"}
                            className="font-mono"
                          >
                            {cluster.cluster === -1 ? "Ruído" : `Cluster ${cluster.cluster}`}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{cluster.size}</TableCell>
                        <TableCell>{cluster.percentage.toFixed(1)}%</TableCell>
                        <TableCell>{cluster.avgRecency.toFixed(0)}</TableCell>
                        <TableCell>{cluster.avgFrequency.toFixed(1)}</TableCell>
                        <TableCell>R$ {cluster.avgMonetary.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Como interpretar:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>Recência:</strong> Dias desde a última interação (menor = mais ativo)</li>
                    <li>• <strong>Frequência:</strong> Número de interações/compras (maior = mais engajado)</li>
                    <li>• <strong>Monetário:</strong> Valor total gasto (maior = mais valioso)</li>
                    <li>• <strong>Ruído:</strong> Pontos que não se encaixam bem em nenhum cluster (apenas DBSCAN)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
