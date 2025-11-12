# WebService NFe SEFAZ

Serviço web Node.js/TypeScript para consultar Notas Fiscais Eletrônicas (NFe) via o web service NFeDistribuicaoDFe da SEFAZ, utilizando certificado A1 (.pfx) e autenticação por API Key.

## 🎯 Características

- **mTLS com Certificado A1**: Autenticação segura via certificado digital (.pfx)
- **API Key Authentication**: Validação de requisições via header `X-API-Key`
- **Ambientes Suportados**: Homologação e Produção
- **Estados Múltiplos**: Suporte para todos os estados (UF) e Ambiente Nacional (AN)
- **Fetch Iterativo**: Busca incremental de documentos com controle de NSU
- **Logs Sanitizados**: Redação automática de dados sensíveis (senhas, CNPJs, CPFs)
- **Segurança**: Helmet.js headers, CORS controlado, validação de entrada

## 📋 Pré-requisitos

- **Node.js** v16+
- **npm** ou **yarn**
- **Certificado A1** (.pfx) emitido pela ICP-Brasil
- **Variáveis de Ambiente** configuradas

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/charlesheusser/webservice_sefaz.git
cd webservice_sefaz
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Ambiente SEFAZ
SEFAZ_AMBIENTE=homologacao  # ou "producao"

# Certificado A1
NFE_CERT_PFX_PATH=cert/seucertificado.pfx
NFE_CERT_PFX_PASSWORD=sua_senha_do_certificado

# Autenticação
API_KEY=sua_chave_api_forte_aqui

# Testes
TEST_CNPJ=34028316000152

# Servidor
PORT=3000  # Opcional, padrão: 3000
```

### 4. Coloque o certificado

Copie seu certificado A1 (.pfx) para a pasta `cert/`:

```bash
mkdir -p cert
# Copie seu arquivo seucertificado.pfx para cert/
```

> ⚠️ **Importante**: O arquivo `.pfx` é protegido no `.gitignore`. Nunca commite certificados!

## 🏗️ Arquitetura

```
src/
├── server.ts                          # Entrada principal, setup Express
├── config/
│   └── sefazConfig.ts                # URLs dos endpoints SEFAZ por UF/ambiente
├── modules/
│   └── nfe/
│       ├── controllers/
│       │   └── nfeController.ts       # Controllers HTTP
│       └── services/
│           └── nfeDistribuicaoDFeService.ts  # Lógica SEFAZ
├── transport/
│   ├── http/
│   │   └── nfe.routes.ts             # Definição de rotas
│   └── middleware/
│       ├── auth.ts                   # Validação API Key
│       └── validateRequest.ts        # Validação de requisição
└── utils/
    └── logger.ts                     # Configuração Pino
```

## 📡 Endpoints

### Distribuição de NFe

**GET** `/api/nfe/distribuicao`

Consulta documentos fiscais disponíveis para um CNPJ.

#### Autenticação

```bash
X-API-Key: sua_chave_api
```

#### Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `cnpj` | string | ✅ | CNPJ (14 dígitos) |
| `ultNSU` | string | ❌ | Último NSU para consulta incremental |
| `nsu` | string | ❌ | NSU específico |
| `ambiente` | string | ❌ | "homologacao" ou "producao" |
| `uf` | string | ❌ | Código UF (padrão: "AN") |
| `fetchAll` | boolean | ❌ | true para buscar todos os documentos |
| `pagina` | number | ❌ | Número da página |
| `limite` | number | ❌ | Itens por página |

#### Exemplo de Requisição

```bash
curl -X GET "http://localhost:3000/api/nfe/distribuicao?cnpj=34028316000152&uf=AN&ambiente=homologacao" \
  -H "X-API-Key: sua_chave_api"
```

#### Resposta de Sucesso (200)

```json
{
  "sucesso": true,
  "ambiente": "homologacao",
  "uf": "AN",
  "resumo": {
    "codigoStatus": "138",
    "motivo": "Documento localizado",
    "ultNSU": "000000000000015",
    "maxNSU": "000000000000020",
    "iteracoes": 1,
    "quantidadeDocumentos": 5
  },
  "documentos": [
    {
      "nsu": "000000000000001",
      "schema": "resNFe_v1.01.xsd",
      "conteudoZipBase64": "UEsDBBQABgAIAAAAIQDp..."
    }
  ]
}
```

#### Resposta de Erro

```json
{
  "sucesso": false,
  "error": "SEFAZ_COMM_ERROR",
  "message": "Erro ao comunicar com o Web Service da SEFAZ."
}
```

## 🔧 Desenvolvimento

### Build

```bash
npm run build
```

Compila TypeScript para JavaScript na pasta `dist/`.

### Modo Desenvolvimento

```bash
npm run dev
```

Executa com `ts-node-dev` com hot reload.

### Linting

```bash
npm run lint
```

Valida código com ESLint.

### Iniciar em Produção

```bash
npm run start
```

Inicia o servidor a partir dos arquivos compilados em `dist/`.

## 🔐 Segurança

### Proteção de Certificado

- Armazenado localmente em `cert/` (excluído do git)
- Senha carregada de variável de ambiente
- Em produção, use gerenciador de secrets (AWS Secrets Manager, HashiCorp Vault, etc.)

### Autenticação API

- Validação de `X-API-Key` em todas as requisições
- Em produção, considere migrar para OAuth2/JWT

### Redação de Logs

Dados sensíveis são automaticamente removidos dos logs:
- Headers de autorização
- Senhas
- CNPJ, CPF
- Chaves de acesso

### HTTPS/mTLS

- Certificado A1 usado para autenticar no SEFAZ
- Em homologação: verificação de certificado pode ser desabilitada se necessário
- Em produção: `rejectUnauthorized: true` (padrão)

## 📝 Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `CERT_CONFIG_ERROR` | Certificado não configurado |
| `CERT_LOAD_ERROR` | Erro ao carregar certificado |
| `SEFAZ_HTTP_ERROR` | Resposta HTTP inválida da SEFAZ |
| `SEFAZ_COMM_ERROR` | Erro de comunicação com SEFAZ |
| `VALIDATION_ERROR` | Validação de parâmetros falhou |
| `UNAUTHORIZED` | API Key inválida ou ausente |
| `CONFIGURATION_ERROR` | Erro de configuração do servidor |

## 🔄 Fluxo de Consulta Iterativa (Fetch All)

Quando `fetchAll=true`:

1. Consulta SEFAZ com `ultNSU` (ou usa último consultado)
2. Acumula documentos da resposta
3. Se há mais documentos (`maxNSU > ultNSU`), incrementa e repete
4. Para ao atingir `maxNSU` ou limite de iterações configurado
5. Retorna todos os documentos acumulados

## 📚 Referências

- [SEFAZ - NFeDistribuicaoDFe](https://www.sefaz.fazenda.gov.br/)
- [NT 2014.002 - Orientações para Integração com NFeDistribuicaoDFe](https://www1.nfe.fazenda.gov.br/portal/webservices.shtml)
- [ICP-Brasil](https://www.icpbrasil.gov.br/)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT**.

A Licença MIT é uma licença de código aberto permissiva que permite:
- ✅ Uso comercial e privado
- ✅ Modificação e distribuição do código
- ✅ Uso sem restrições de tempo

Com as seguintes condições:
- ⚠️ Incluir uma cópia da licença e aviso de copyright
- ⚠️ O software é fornecido "AS IS", sem garantias

Para mais detalhes, veja o arquivo [LICENSE](LICENSE) no repositório.

## ⚠️ Aviso Legal

Este projeto é uma implementação de integração com os web services da SEFAZ. Certifique-se de:

- Estar autorizado a emitir/receber NFe
- Possuir certificado digital válido
- Respeitar todas as legislações fiscais brasileiras
- Testar em homologação antes de usar em produção


**Desenvolvido com ❤️**
