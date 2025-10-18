import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGenres, searchCities } from "@/lib/marketingHelpers";
import { toast } from "sonner";

const eventSchema = z.object({
  event_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  event_date: z.string().refine((date) => {
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate > today;
  }, "Data deve ser futura"),
  event_city: z.string().min(2, "Cidade inválida"),
  event_venue: z.string().optional(),
  event_genre: z.string().min(2, "Selecione um gênero"),
  target_audience: z.string().min(10, "Descreva o público-alvo com mais detalhes"),
  capacity: z.coerce.number().min(1, "Capacidade deve ser maior que 0"),
  ticket_price: z.coerce.number().min(0, "Preço inválido"),
  budget: z.coerce.number().min(0, "Orçamento inválido").optional(),
  description: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface MarketingFormProps {
  onSubmit: (data: EventFormData) => Promise<void>;
  isLoading?: boolean;
}

export function MarketingForm({ onSubmit, isLoading }: MarketingFormProps) {
  const [genres, setGenres] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const selectedGenre = watch("event_genre");
  const selectedCity = watch("event_city");

  useEffect(() => {
    getGenres().then(setGenres);
  }, []);

  useEffect(() => {
    if (citySearch.length >= 2) {
      searchCities(citySearch).then(setCitySuggestions);
    } else {
      setCitySuggestions([]);
    }
  }, [citySearch]);

  const handleCitySelect = (city: string) => {
    setValue("event_city", city);
    setCitySearch(city);
    setCitySuggestions([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Evento</CardTitle>
        <CardDescription>
          Preencha os detalhes do evento para gerar um plano de marketing personalizado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Evento */}
            <div className="space-y-2">
              <Label htmlFor="event_name">Nome do Evento *</Label>
              <Input
                id="event_name"
                {...register("event_name")}
                placeholder="Ex: Festival de Verão 2025"
              />
              {errors.event_name && (
                <p className="text-sm text-destructive">{errors.event_name.message}</p>
              )}
            </div>

            {/* Data do Evento */}
            <div className="space-y-2">
              <Label htmlFor="event_date">Data do Evento *</Label>
              <Input
                id="event_date"
                type="date"
                {...register("event_date")}
              />
              {errors.event_date && (
                <p className="text-sm text-destructive">{errors.event_date.message}</p>
              )}
            </div>

            {/* Cidade */}
            <div className="space-y-2 relative">
              <Label htmlFor="event_city">Cidade *</Label>
              <Input
                id="event_city"
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setValue("event_city", e.target.value);
                }}
                placeholder="Digite a cidade"
                autoComplete="off"
              />
              {citySuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                  {citySuggestions.map((city) => (
                    <div
                      key={city}
                      className="px-4 py-2 hover:bg-accent cursor-pointer"
                      onClick={() => handleCitySelect(city)}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}
              {errors.event_city && (
                <p className="text-sm text-destructive">{errors.event_city.message}</p>
              )}
            </div>

            {/* Local */}
            <div className="space-y-2">
              <Label htmlFor="event_venue">Local/Venue</Label>
              <Input
                id="event_venue"
                {...register("event_venue")}
                placeholder="Ex: Arena Music Hall"
              />
            </div>

            {/* Gênero Musical */}
            <div className="space-y-2">
              <Label htmlFor="event_genre">Gênero Musical *</Label>
              <Select
                value={selectedGenre}
                onValueChange={(value) => setValue("event_genre", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              {errors.event_genre && (
                <p className="text-sm text-destructive">{errors.event_genre.message}</p>
              )}
            </div>

            {/* Capacidade */}
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade *</Label>
              <Input
                id="capacity"
                type="number"
                {...register("capacity")}
                placeholder="Ex: 1000"
              />
              {errors.capacity && (
                <p className="text-sm text-destructive">{errors.capacity.message}</p>
              )}
            </div>

            {/* Preço Médio */}
            <div className="space-y-2">
              <Label htmlFor="ticket_price">Preço Médio do Ingresso (R$) *</Label>
              <Input
                id="ticket_price"
                type="number"
                step="0.01"
                {...register("ticket_price")}
                placeholder="Ex: 50.00"
              />
              {errors.ticket_price && (
                <p className="text-sm text-destructive">{errors.ticket_price.message}</p>
              )}
            </div>

            {/* Orçamento */}
            <div className="space-y-2">
              <Label htmlFor="budget">Orçamento de Marketing (R$)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                {...register("budget")}
                placeholder="Ex: 5000.00 (opcional)"
              />
              <p className="text-xs text-muted-foreground">
                Opcional - deixe em branco se não definido
              </p>
              {errors.budget && (
                <p className="text-sm text-destructive">{errors.budget.message}</p>
              )}
            </div>
          </div>

          {/* Público-Alvo */}
          <div className="space-y-2">
            <Label htmlFor="target_audience">Público-Alvo *</Label>
            <Textarea
              id="target_audience"
              {...register("target_audience")}
              placeholder="Descreva seu público-alvo: idade, interesses, comportamento..."
              rows={3}
            />
            {errors.target_audience && (
              <p className="text-sm text-destructive">{errors.target_audience.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição Adicional</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Informações adicionais sobre o evento..."
              rows={4}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando Plano...
              </>
            ) : (
              "Gerar Plano de Marketing"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
