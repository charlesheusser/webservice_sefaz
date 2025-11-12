/**
 * Script de teste interno para validar o fluxo ponta a ponta do webservice
 * utilizando o endpoint HTTP local. Não será exposto em produção.
 *
 * Como usar:
 *  1) Garanta que o arquivo .env está configurado corretamente.
 *  2) Rode: npm run build
 *  3) Em um terminal: npm start
 *  4) Em outro terminal: npx ts-node scripts/test-distribuicao-nfe.ts
 *
 * Este script:
 *  - Chama /health para validar o serviço.
 *  - Chama /api/nfe/distribuicao com fetchAll=true para buscar todas as NF-es/DF-es.
 *  - Loga um resumo seguro no console.
 */

import "dotenv/config";
import axios from "axios";

async function main() {
  const baseURL = process.env.TEST_BASE_URL || "http://localhost:3000";
  const apiKey = process.env.API_KEY;
  const cnpj = process.env.TEST_CNPJ || ""; // Defina TEST_CNPJ no .env (CNPJ vinculado ao certificado)

  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.error("[TEST] API_KEY não definida no .env. Ajuste antes de testar.");
    process.exit(1);
  }

  if (!cnpj || cnpj.length !== 14) {
    // eslint-disable-next-line no-console
    console.error("[TEST] TEST_CNPJ não definido ou inválido no .env. Informe o CNPJ do certificado (14 dígitos).");
    process.exit(1);
  }

  try {
    // 1) Testa o /health
    const health = await axios.get(`${baseURL}/health`, {
      headers: {
        "x-api-key": apiKey
      },
      validateStatus: () => true
    });

    // eslint-disable-next-line no-console
    console.log("[TEST] /health status:", health.status, "body:", health.data);

    if (health.status !== 200) {
      // eslint-disable-next-line no-console
      console.error("[TEST] /health não retornou 200. Verifique logs do servidor antes de prosseguir.");
      process.exit(1);
    }

    // 2) Testa o endpoint de distribuição com fetchAll=true
    const distrib = await axios.get(
      `${baseURL}/api/nfe/distribuicao`,
      {
        headers: {
          "x-api-key": apiKey
        },
        params: {
          cnpj,
          fetchAll: "true"
        },
        validateStatus: () => true
      }
    );

    // eslint-disable-next-line no-console
    console.log("[TEST] /api/nfe/distribuicao status:", distrib.status);

    if (distrib.status !== 200) {
      // eslint-disable-next-line no-console
      console.error("[TEST] Erro na chamada de distribuição:", distrib.data);
      process.exit(1);
    }

    const resumo = distrib.data?.resumo;
    const documentos = distrib.data?.documentos || [];

    // eslint-disable-next-line no-console
    console.log("[TEST] Resumo distribuição:", {
      codigoStatus: resumo?.codigoStatus,
      motivo: resumo?.motivo,
      ultNSU: resumo?.ultNSU,
      maxNSU: resumo?.maxNSU,
      iteracoes: resumo?.iteracoes,
      quantidadeDocumentos: resumo?.quantidadeDocumentos
    });

    // Mostra só alguns NSUs para auditoria rápida
    const sample = documentos.slice(0, 5).map((d: any) => ({
      nsu: d.nsu,
      schema: d.schema
    }));

    // eslint-disable-next-line no-console
    console.log("[TEST] Amostra de documentos retornados (NSU/schema):", sample);

    // eslint-disable-next-line no-console
    console.log("[TEST] Fluxo de distribuição executado com sucesso. Verifique logs pino para auditoria detalhada.");
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("[TEST] Falha inesperada no teste:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    });
    process.exit(1);
  }
}

main();