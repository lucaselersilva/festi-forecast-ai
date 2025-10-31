import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useTenant } from "@/hooks/useTenant"

interface ClientsTableProps {
  clients: any[]
  onRefresh: () => void
}

const ClientsTable = ({ clients, onRefresh }: ClientsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingClient, setEditingClient] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const { toast } = useToast()
  const { tenantId } = useTenant()

  const filteredClients = clients.filter(client => {
    const search = searchTerm.toLowerCase()
    return (
      client.nome?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.telefone?.includes(search) ||
      client.cpf?.includes(search)
    )
  })

  const handleEdit = (client: any) => {
    setEditingClient(client)
    setFormData({
      nome: client.nome || "",
      email: client.email || "",
      telefone: client.telefone || "",
      genero: client.genero || "",
      cpf: client.cpf || "",
      aniversario: client.aniversario || "",
      aplicativo_ativo: client.aplicativo_ativo || false,
    })
  }

  const handleSave = async () => {
    if (!editingClient || !tenantId) return

    try {
      const { error } = await supabase
        .from('valle_clientes')
        .update(formData)
        .eq('id', editingClient.id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast({
        title: "Cliente atualizado",
        description: "As informações foram salvas com sucesso.",
      })
      setEditingClient(null)
      onRefresh()
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm || !tenantId) return

    try {
      const { error } = await supabase
        .from('valle_clientes')
        .delete()
        .eq('id', deleteConfirm.id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast({
        title: "Cliente removido",
        description: "O cliente foi removido com sucesso.",
      })
      setDeleteConfirm(null)
      onRefresh()
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "R$ 0"
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <>
      <Card className="glass border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Base de Clientes</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, telefone ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredClients.length} de {clients.length}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Gênero</TableHead>
                  <TableHead>Aniversário</TableHead>
                  <TableHead className="text-right">Consumo</TableHead>
                  <TableHead className="text-center">Presenças</TableHead>
                  <TableHead className="text-center">App Ativo</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{client.email || "-"}</TableCell>
                    <TableCell>{client.telefone || "-"}</TableCell>
                    <TableCell>{client.genero || "-"}</TableCell>
                    <TableCell>{formatDate(client.aniversario)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(client.consumo)}</TableCell>
                    <TableCell className="text-center">{client.presencas || 0}</TableCell>
                    <TableCell className="text-center">
                      {client.aplicativo_ativo ? (
                        <CheckCircle2 className="w-4 h-4 text-success mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(client)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome || ""}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ""}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf || ""}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genero">Gênero</Label>
              <Input
                id="genero"
                value={formData.genero || ""}
                onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aniversario">Aniversário</Label>
              <Input
                id="aniversario"
                type="date"
                value={formData.aniversario || ""}
                onChange={(e) => setFormData({ ...formData, aniversario: e.target.value })}
              />
            </div>
            <div className="space-y-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="aplicativo_ativo"
                checked={formData.aplicativo_ativo || false}
                onChange={(e) => setFormData({ ...formData, aplicativo_ativo: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="aplicativo_ativo">App Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o cliente <strong>{deleteConfirm?.nome}</strong>? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remover Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ClientsTable
