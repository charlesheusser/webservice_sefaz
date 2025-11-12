# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.1.0-alpha] - 2024-11-12

### ✨ Adicionado

- **Endpoint Principal**: GET `/api/nfe/distribuicao` para consultar documentos fiscais
- **Autenticação mTLS**: Suporte para certificado digital A1 (.pfx)
- **Autenticação API Key**: Validação via header `X-API-Key`
- **Fetch Iterativo**: Suporte para `fetchAll=true` para buscar todos os documentos
- **Múltiplos Ambientes**: Suporte para homologação e produção
- **Múltiplos Estados**: Suporte para todos os estados (UF) e Ambiente Nacional (AN)
- **Logs Sanitizados**: Redação automática de dados sensíveis (senhas, CNPJs, CPFs)
- **Segurança**:
  - Helmet.js para headers de segurança
  - CORS controlado
  - Validação de entrada com express-validator
  - Redação de logs sensíveis
- **Validação de Requisição**:
  - CNPJ obrigatório (14 dígitos)
  - NSU opcional
  - Parâmetros de UF e ambiente
- **Tratamento de Erros**:
  - Códigos de erro padronizados
  - Mensagens descritivas
  - Logging estruturado com Pino
- **Documentação**:
  - README.md completo em português
  - Exemplos de requisição
  - Guia de instalação
  - Documentação de segurança

### 🔧 Tecnologias

- **Runtime**: Node.js v16+
- **Linguagem**: TypeScript
- **Framework Web**: Express.js
- **HTTP Client**: Axios com mTLS
- **Logging**: Pino
- **Segurança**: Helmet.js
- **Validação**: express-validator
- **Desenvolvimento**: ts-node-dev, ESLint

### 📋 Stack Técnico

```json
{
  "name": "webservice_nfe_sefaz",
  "version": "0.1.0-alpha",
  "description": "Serviço web para consultar NFe via SEFAZ",
  "main": "dist/src/server.js",
  "type": "module"
}
```

### 🚀 Como Começar

#### Instalação

```bash
git clone https://github.com/seu-usuario/webservice_nfe_sefaz.git
cd webservice_nfe_sefaz
npm install
```

#### Configuração

Crie um arquivo `.env`:

```env
SEFAZ_AMBIENTE=homologacao
NFE_CERT_PFX_PATH=cert/certificado_icavi.pfx
NFE_CERT_PFX_PASSWORD=sua_senha
API_KEY=sua_chave_api
TEST_CNPJ=34028316000152
PORT=3000
```

#### Desenvolvimento

```bash
npm run dev
```

#### Build para Produção

```bash
npm run build
npm run start
```

### 📡 Endpoint Disponível

**GET** `/api/nfe/distribuicao`

**Parâmetros obrigatórios:**
- `cnpj` - CNPJ com 14 dígitos

**Parâmetros opcionais:**
- `ultNSU` - Último NSU para consulta incremental
- `nsu` - NSU específico
- `ambiente` - "homologacao" ou "producao"
- `uf` - Código UF (padrão: "AN")
- `fetchAll` - true para buscar todos os documentos
- `pagina`, `limite` - Paginação

**Exemplo:**

```bash
curl -X GET "http://localhost:3000/api/nfe/distribuicao?cnpj=34028316000152&uf=AN" \
  -H "X-API-Key: sua_chave_api"
```

### ⚠️ Limitações Conhecidas (Alpha)

- ❌ Paginação não está completamente implementada
- ❌ Interface web/dashboard não disponível
- ❌ Suporte a PostgreSQL/MongoDB não incluído
- ⚠️ Certificado carregado apenas do filesystem (não suporta secrets managers ainda)
- ⚠️ Autenticação simples com API Key (considere OAuth2/JWT para produção)
- ⚠️ Verificação de certificado SEFAZ pode gerar erros em homologação

### 🔐 Segurança

#### Estado Atual

- ✅ mTLS com certificado A1
- ✅ API Key authentication
- ✅ Logs sanitizados
- ✅ Helmet.js headers
- ✅ Input validation
- ✅ CORS controlado

#### Recomendações para Produção

- Migrar autenticação para OAuth2/JWT
- Usar gerenciador de secrets (AWS Secrets Manager, HashiCorp Vault)
- Implementar rate limiting
- Adicionar autenticação multifatorial
- Monitorar requisições e alertar sobre anomalias
- Usar WAF (Web Application Firewall)

### 📝 Notas da Versão

#### O que Funciona

- ✅ Consulta única de documentos SEFAZ
- ✅ Busca iterativa com fetchAll
- ✅ Autenticação mTLS com certificado A1
- ✅ Validação de entrada
- ✅ Tratamento de erros
- ✅ Logging estruturado

#### O que Não Funciona Ainda

- ❌ Cache de documentos
- ❌ Retry automático com backoff
- ❌ Webhook para notificações
- ❌ Banco de dados para persistência
- ❌ Interface gráfica
- ❌ Documentação OpenAPI/Swagger

#### Próximas Prioridades (v0.2.0)

- [ ] Implementar cache de documentos
- [ ] Adicionar retry com exponential backoff
- [ ] Documentação OpenAPI/Swagger
- [ ] Testes unitários completos
- [ ] Testes de integração
- [ ] Health check endpoint
- [ ] Métricas Prometheus

### 🤝 Contribuições

Alpha release é para testes e feedback. Por favor reporte issues e sugestões!

[Abrir Issue](https://github.com/seu-usuario/webservice_nfe_sefaz/issues)

### 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

**Status**: 🚧 Alpha (Em Desenvolvimento)
**Data**: 12 de Novembro de 2024
**Versão**: 0.1.0-alpha
