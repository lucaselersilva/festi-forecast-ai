import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { BarChart3, Users, TrendingUp, Zap } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Event Analytics</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button onClick={() => navigate("/auth?mode=signup")}>
              Criar Conta
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Análise Inteligente de Eventos
          </h1>
          <p className="text-xl text-muted-foreground">
            Transforme dados em insights acionáveis. Gerencie eventos, clientes e campanhas de marketing com inteligência artificial.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/auth?mode=signup")}>
              Começar Gratuitamente
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Dashboard em Tempo Real</h3>
            <p className="text-sm text-muted-foreground">
              Visualize métricas e KPIs dos seus eventos em tempo real com gráficos interativos.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Segmentação de Clientes</h3>
            <p className="text-sm text-muted-foreground">
              Identifique padrões de comportamento e segmente sua base de clientes automaticamente.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Previsões Inteligentes</h3>
            <p className="text-sm text-muted-foreground">
              Modelos de ML para prever vendas, receitas e comportamento de clientes.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Automação de Marketing</h3>
            <p className="text-sm text-muted-foreground">
              Crie campanhas personalizadas com base em dados e comportamento dos clientes.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-16">
        <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Crie sua conta gratuitamente e comece a analisar seus eventos hoje mesmo.
          </p>
          <Button size="lg" onClick={() => navigate("/auth?mode=signup")}>
            Criar Conta Grátis
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          © 2025 Event Analytics. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
