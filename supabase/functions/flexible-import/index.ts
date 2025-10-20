import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== TIPOS ==========
interface ColumnMapping {
  [excelColumn: string]: string; // db field
}

interface ValidationResult {
  row: number;
  field: string;
  value: any;
  error: string;
  severity: 'error' | 'warning';
}

// ========== DETECTOR DE COLUNAS ==========
class ColumnDetector {
  static SYNONYMS: Record<string, string[]> = {
    'nome': ['nome', 'name', 'customer name', 'cliente', 'client', 'nome completo'],
    'email': ['email', 'e-mail', 'mail', 'email address', 'correio', 'e mail'],
    'telefone': ['telefone', 'phone', 'celular', 'mobile', 'tel', 'whatsapp', 'fone'],
    'aniversario': ['aniversário', 'aniversario', 'birthday', 'birth date', 'data nascimento', 'nascimento', 'data de nascimento'],
    'cpf': ['cpf', 'documento', 'tax id', 'doc'],
    'consumo': ['consumo', 'total', 'spend', 'spent', 'gasto', 'valor', 'valor total'],
    'genero': ['gênero', 'genero', 'gender', 'sexo'],
    'presencas': ['presenças', 'presencas', 'visitas', 'visits', 'frequencia'],
    'primeira_entrada': ['primeira entrada', 'first visit', 'primeira visita', 'primeira entrada no local'],
    'ultima_visita': ['última visita', 'last visit', 'ultima visita'],
    'aplicativo_ativo': ['aplicativo ativo', 'app ativo', 'active app'],
  };

  static detectMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const normalized = normalizedHeaders[i];
      
      for (const [field, synonyms] of Object.entries(this.SYNONYMS)) {
        const match = synonyms.some(syn => {
          const normalizedSyn = syn.toLowerCase();
          return normalized === normalizedSyn || normalized.includes(normalizedSyn);
        });
        
        if (match && !Object.values(mapping).includes(field)) {
          mapping[header] = field;
          break;
        }
      }
    }
    
    return mapping;
  }

  static calculateConfidence(mapping: ColumnMapping): number {
    const essentialFields = ['nome'];
    const optionalImportantFields = ['email', 'telefone'];
    
    const hasEssential = essentialFields.every(f => 
      Object.values(mapping).includes(f)
    );
    
    if (!hasEssential) return 0;
    
    const hasContact = optionalImportantFields.some(f => 
      Object.values(mapping).includes(f)
    );
    
    if (!hasContact) return 50;
    
    const totalMapped = Object.keys(mapping).length;
    return Math.min(100, 50 + (totalMapped * 10));
  }
}

// ========== VALIDADOR DE DADOS ==========
class DataValidator {
  static validateRow(row: any, mapping: ColumnMapping, rowIndex: number): ValidationResult[] {
    const errors: ValidationResult[] = [];
    
    // CAMPO OBRIGATÓRIO: Nome
    const nomeColumn = Object.keys(mapping).find(k => mapping[k] === 'nome');
    if (nomeColumn) {
      const nomeValue = row[nomeColumn];
      if (!nomeValue || String(nomeValue).trim() === '') {
        errors.push({
          row: rowIndex,
          field: 'nome',
          value: nomeValue,
          error: '❌ OBRIGATÓRIO: Nome não pode estar vazio',
          severity: 'error'
        });
      }
    } else {
      errors.push({
        row: rowIndex,
        field: 'nome',
        value: null,
        error: '❌ OBRIGATÓRIO: Coluna "Nome" não foi mapeada',
        severity: 'error'
      });
    }
    
    // CAMPO OBRIGATÓRIO: Email OU Telefone (pelo menos um)
    const emailColumn = Object.keys(mapping).find(k => mapping[k] === 'email');
    const telefoneColumn = Object.keys(mapping).find(k => mapping[k] === 'telefone');
    
    const hasEmail = emailColumn && row[emailColumn] && String(row[emailColumn]).trim() !== '';
    const hasTelefone = telefoneColumn && row[telefoneColumn] && String(row[telefoneColumn]).trim() !== '';
    
    if (!hasEmail && !hasTelefone) {
      errors.push({
        row: rowIndex,
        field: 'contato',
        value: null,
        error: '❌ OBRIGATÓRIO: É necessário informar EMAIL ou TELEFONE (pelo menos um)',
        severity: 'error'
      });
    }
    
    // Validar formato de email se presente
    if (hasEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(row[emailColumn]).trim())) {
        errors.push({
          row: rowIndex,
          field: 'email',
          value: row[emailColumn],
          error: '⚠️ Email em formato inválido',
          severity: 'warning'
        });
      }
    }
    
    // Validar telefone se presente
    if (hasTelefone) {
      const digits = String(row[telefoneColumn]).replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 11) {
        errors.push({
          row: rowIndex,
          field: 'telefone',
          value: row[telefoneColumn],
          error: '⚠️ Telefone deve ter 10 ou 11 dígitos',
          severity: 'warning'
        });
      }
    }
    
    return errors;
  }
}

// ========== NORMALIZADOR DE DADOS ==========
class DataNormalizer {
  static parseDate(value: any): string | null {
    if (!value) return null;
    
    try {
      // Excel serial date
      if (typeof value === 'number') {
        const date = new Date((value - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      
      // String DD/MM/YYYY ou DD-MM-YYYY
      if (typeof value === 'string') {
        const cleaned = value.trim();
        const parts = cleaned.split(/[\/\-]/);
        if (parts.length === 3) {
          const [day, month, year] = parts.map(Number);
          if (day > 0 && day <= 31 && month > 0 && month <= 12) {
            const fullYear = year < 100 ? 2000 + year : year;
            const date = new Date(fullYear, month - 1, day);
            return date.toISOString().split('T')[0];
          }
        }
      }
      
      // JavaScript Date
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Date parse error:', error);
    }
    
    return null;
  }

  static parseDateTime(value: any): string | null {
    if (!value) return null;
    
    try {
      // Excel serial date with time
      if (typeof value === 'number') {
        const date = new Date((value - 25569) * 86400 * 1000);
        return date.toISOString();
      }
      
      // String format
      if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      // JavaScript Date
      if (value instanceof Date) {
        return value.toISOString();
      }
    } catch (error) {
      console.error('DateTime parse error:', error);
    }
    
    return null;
  }

  static parseCurrency(value: any): number {
    if (!value) return 0;
    const cleaned = String(value)
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();
    return parseFloat(cleaned) || 0;
  }

  static parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      return lower === 'sim' || lower === 'yes' || lower === 'true' || lower === '1' || lower === 'ativo';
    }
    if (typeof value === 'number') return value === 1;
    return Boolean(value);
  }

  static removeNonDigits(value: any): string | null {
    if (!value) return null;
    return String(value).replace(/\D/g, '');
  }

  static normalizeRow(row: any, mapping: ColumnMapping, transformations: any): any {
    const normalized: any = {};
    
    for (const [excelCol, dbField] of Object.entries(mapping)) {
      let value = row[excelCol];
      
      // Aplicar transformações se definidas
      const transform = transformations?.[dbField];
      if (transform && value !== null && value !== undefined && value !== '') {
        switch (transform) {
          case 'parse_date':
            value = this.parseDate(value);
            break;
          case 'parse_datetime':
            value = this.parseDateTime(value);
            break;
          case 'parse_currency':
            value = this.parseCurrency(value);
            break;
          case 'parse_boolean':
            value = this.parseBoolean(value);
            break;
          case 'remove_non_digits':
            value = this.removeNonDigits(value);
            break;
        }
      }
      
      normalized[dbField] = value;
    }
    
    return normalized;
  }
}

// ========== HANDLER PRINCIPAL ==========
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, data } = await req.json();

    switch (action) {
      case 'detect_mapping': {
        const { headers, templateId } = data;
        
        let mapping: ColumnMapping;
        let confidence: number;
        let transformations: any = {};
        
        if (templateId) {
          const { data: template } = await supabase
            .from('import_templates')
            .select('column_mappings, field_transformations')
            .eq('id', templateId)
            .single();
            
          if (template) {
            mapping = template.column_mappings;
            transformations = template.field_transformations || {};
            confidence = 100;
          } else {
            mapping = ColumnDetector.detectMapping(headers);
            confidence = ColumnDetector.calculateConfidence(mapping);
          }
        } else {
          mapping = ColumnDetector.detectMapping(headers);
          confidence = ColumnDetector.calculateConfidence(mapping);
          
          // Buscar transformações do template padrão
          const { data: defaultTemplate } = await supabase
            .from('import_templates')
            .select('field_transformations')
            .eq('is_default', true)
            .single();
            
          if (defaultTemplate) {
            transformations = defaultTemplate.field_transformations || {};
          }
        }
        
        return new Response(JSON.stringify({ 
          mapping, 
          confidence,
          transformations,
          requiredFields: {
            obrigatorios: [
              { field: 'nome', description: 'Nome do cliente (texto)' },
              { field: 'email_ou_telefone', description: 'Email OU Telefone (pelo menos um)' }
            ],
            opcionais: [
              { field: 'cpf', description: 'CPF (apenas números)' },
              { field: 'aniversario', description: 'Data de aniversário (DD/MM/AAAA)' },
              { field: 'telefone', description: 'Telefone (com DDD)' },
              { field: 'email', description: 'Email válido' },
              { field: 'genero', description: 'Gênero (M/F/Outro)' },
              { field: 'consumo', description: 'Valor total consumido (R$)' },
              { field: 'presencas', description: 'Número de visitas' }
            ]
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'validate_data': {
        const { rows, mapping } = data;
        
        const allErrors: ValidationResult[] = [];
        
        rows.forEach((row: any, index: number) => {
          const errors = DataValidator.validateRow(row, mapping, index + 2); // +2 porque linha 1 é header
          allErrors.push(...errors);
        });
        
        const errorRows = new Set(allErrors.filter(e => e.severity === 'error').map(e => e.row));
        
        const stats = {
          total: rows.length,
          valid: rows.length - errorRows.size,
          warnings: allErrors.filter(e => e.severity === 'warning').length,
          errors: errorRows.size,
          canImport: errorRows.size === 0
        };
        
        return new Response(JSON.stringify({ errors: allErrors, stats }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'import_data': {
        const { rows, mapping, transformations } = data;
        
        // Validar novamente antes de importar
        const allErrors: ValidationResult[] = [];
        rows.forEach((row: any, index: number) => {
          const errors = DataValidator.validateRow(row, mapping, index + 2);
          allErrors.push(...errors.filter(e => e.severity === 'error'));
        });
        
        if (allErrors.length > 0) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Dados contêm erros. Corrija antes de importar.',
            errors: allErrors
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Normalizar todos os rows
        const normalizedRows = rows
          .map((row: any) => DataNormalizer.normalizeRow(row, mapping, transformations))
          .filter((row: any) => row.nome); // Apenas rows com nome
        
        // Importar em valle_clientes
        const { data: imported, error } = await supabase
          .from('valle_clientes')
          .upsert(normalizedRows, {
            onConflict: 'cpf',
            ignoreDuplicates: false
          })
          .select();
          
        if (error) {
          console.error('Import error:', error);
          throw new Error(`Erro ao importar: ${error.message}`);
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          imported: imported?.length || normalizedRows.length,
          message: `${imported?.length || normalizedRows.length} clientes importados com sucesso!`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'save_template': {
        const { name, sourceName, description, mapping, transformations } = data;
        
        const { data: template, error } = await supabase
          .from('import_templates')
          .insert({
            name,
            source_name: sourceName,
            description,
            column_mappings: mapping,
            field_transformations: transformations
          })
          .select()
          .single();
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ 
          success: true,
          template 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'list_templates': {
        const { data: templates, error } = await supabase
          .from('import_templates')
          .select('*')
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ templates }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }
    
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
