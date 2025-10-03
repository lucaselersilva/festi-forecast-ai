import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Target } from "lucide-react";

interface Props {
  eventId: string;
  setEventId: (id: string) => void;
  goal: string;
  setGoal: (goal: string) => void;
  constraints: any;
  setConstraints: (constraints: any) => void;
  onGenerate: () => void;
  loading: boolean;
}

export default function ObjectiveForm({
  eventId,
  setEventId,
  goal,
  setGoal,
  constraints,
  setConstraints,
  onGenerate,
  loading
}: Props) {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('id, artist, date, city, genre')
      .order('date', { ascending: false })
      .limit(50);
    
    if (data) setEvents(data);
  };

  const toggleChannel = (channel: string) => {
    const updated = selectedChannels.includes(channel)
      ? selectedChannels.filter(c => c !== channel)
      : [...selectedChannels, channel];
    setSelectedChannels(updated);
    setConstraints({ ...constraints, allowed_channels: updated });
  };

  const channels = ['whatsapp', 'email', 'sms', 'instagram', 'push'];

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Passo 1: Objetivo & Contexto</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Evento</Label>
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um evento" />
            </SelectTrigger>
            <SelectContent>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.artist} - {event.city} ({new Date(event.date).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Objetivo</Label>
          <Select value={goal} onValueChange={setGoal}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boost_revenue">Aumentar Receita</SelectItem>
              <SelectItem value="reactivate_at_risk">Reativar Inativos</SelectItem>
              <SelectItem value="cross_sell">Cross-sell de Gêneros</SelectItem>
              <SelectItem value="vip_upgrade">Upgrade VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Restrições</Label>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Capacidade Máxima</Label>
            <Input
              type="number"
              placeholder="Ex: 5000"
              value={constraints.max_capacity || ''}
              onChange={(e) => setConstraints({ ...constraints, max_capacity: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Margem Mínima (R$)</Label>
            <Input
              type="number"
              placeholder="Ex: 30"
              value={constraints.min_margin || ''}
              onChange={(e) => setConstraints({ ...constraints, min_margin: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Orçamento (R$)</Label>
            <Input
              type="number"
              placeholder="Ex: 50000"
              value={constraints.budget || ''}
              onChange={(e) => setConstraints({ ...constraints, budget: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Canais Permitidos</Label>
        <div className="flex flex-wrap gap-2">
          {channels.map(channel => (
            <Badge
              key={channel}
              variant={selectedChannels.includes(channel) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleChannel(channel)}
            >
              {channel}
            </Badge>
          ))}
        </div>
      </div>

      <Button
        onClick={onGenerate}
        disabled={!eventId || loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Gerando Plano...' : 'Gerar Plano de Dados'}
      </Button>
    </Card>
  );
}