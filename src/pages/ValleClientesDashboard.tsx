import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const ValleClientesDashboard = () => {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    try {
      console.log('🔄 Carregando clientes...')
      const { data, error } = await supabase
        .from('valle_clientes')
        .select('*')
        .order('primeira_entrada', { ascending: false })
      
      if (error) {
        console.error('❌ Erro ao carregar:', error)
        throw error
      }
      
      console.log('✅ Clientes carregados:', data?.length)
      setClientes(data || [])
      setLoading(false)
    } catch (error) {
      console.error('❌ Erro:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando clientes...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Valle Clientes</h1>
        <p className="text-muted-foreground">Dados brutos dos clientes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total: {clientes.length} clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Gênero</TableHead>
                  <TableHead className="text-right">Consumo</TableHead>
                  <TableHead className="text-right">Presenças</TableHead>
                  <TableHead>Última Visita</TableHead>
                  <TableHead>App Ativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.slice(0, 100).map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome || '-'}</TableCell>
                      <TableCell>{cliente.email || '-'}</TableCell>
                      <TableCell>{cliente.telefone || '-'}</TableCell>
                      <TableCell>{cliente.genero || '-'}</TableCell>
                      <TableCell className="text-right">
                        R$ {cliente.consumo?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-right">{cliente.presencas || 0}</TableCell>
                      <TableCell>
                        {cliente.ultima_visita 
                          ? new Date(cliente.ultima_visita).toLocaleDateString('pt-BR')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {cliente.aplicativo_ativo ? '✅' : '❌'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {clientes.length > 100 && (
            <p className="text-sm text-muted-foreground mt-4">
              Mostrando 100 de {clientes.length} clientes (paginação será adicionada em breve)
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ValleClientesDashboard
