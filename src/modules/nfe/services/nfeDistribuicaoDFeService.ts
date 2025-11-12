import https from "https";
import axios, { AxiosInstance } from "axios";
import fs from "fs";
import path from "path";
import { Ambiente } from "../../../config/sefazConfig";

export interface NFeDistribuicaoDFeParams {
  cnpj: string;
  ultNSU?: string;
  nsu?: string;
  sefazUrl: string; // mantido para compatibilidade, não é mais usado
  ambiente: Ambiente;
  fetchAll?: boolean;
  maxIteracoes?: number;
}

export interface DocumentoDistribuido {
  nsu: string;
  schema: string;
  conteudoZipBase64: string;
}

export interface ResultadoDistribuicao {
  resumo: {
    codigoStatus: string;
    motivo: string;
    ultNSU: string;
    maxNSU: string;
    iteracoes: number;
    quantidadeDocumentos: number;
  };
  documentos: DocumentoDistribuido[];
}

/**
 * Implementação baseada em HTTP direto (axios + HTTPS mTLS) inspirada no node-mde.
 * Remove TODA dependência da lib "soap" (fonte do erro createClient).
 *
 * Fluxo:
 * - Monta distDFeInt (XML) com tpAmb, xServ, CNPJ, NSU.
 * - Envelopa em SOAP 1.2 manualmente.
 * - Envia via POST com certificado cliente (A1) no HTTPS Agent.
 */
export async function executarNFeDistribuicaoDFePorCnpj(
  params: NFeDistribuicaoDFeParams
): Promise<ResultadoDistribuicao> {
  const { cnpj, ultNSU, nsu, ambiente, fetchAll, maxIteracoes } = params;

  const pfxPath = process.env.NFE_CERT_PFX_PATH;
  const pfxPassword = process.env.NFE_CERT_PFX_PASSWORD;

  if (!pfxPath || !pfxPassword) {
    const error: any = new Error("Certificado A1 não configurado.");
    error.code = "CERT_CONFIG_ERROR";
    error.isOperational = true;
    error.statusCode = 500;
    throw error;
  }

  let pfxBuffer: Buffer;
  try {
    pfxBuffer = fs.readFileSync(path.resolve(pfxPath));
  } catch {
    const error: any = new Error("Falha ao carregar certificado A1.");
    error.code = "CERT_LOAD_ERROR";
    error.isOperational = true;
    error.statusCode = 500;
    throw error;
  }

  const tpAmb = ambiente === "producao" ? "1" : "2";

  // URLs oficiais padrão nacional (atualizadas conforme NT vigente)
  // Nota: URLs antigas foram descontinuadas em 23/05/2022 - agora usam www1 e hom1
  const baseURL =
    tpAmb === "1"
      ? "https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx"
      : "https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx";

  const axiosInstance = criarClienteAxios(baseURL, pfxBuffer, pfxPassword);

  if (fetchAll) {
    return await executarFetchAll({
      axiosInstance,
      cnpj,
      tpAmb,
      maxIteracoes: maxIteracoes ?? 50
    });
  }

  const distNSUFragment = montarDistNSUFragment({ nsu, ultNSU });
  const xmlBody = montarXmlDistDFeInt({ cnpj, tpAmb, distNSUFragment });
  const envelope = enveloparSoap(xmlBody);

  const retornoXml = await enviarDistribuicao(axiosInstance, envelope);

  const resumoParcial = extrairResumoDistribuicao(retornoXml);
  const documentos = extrairDocumentosDistribuidos(retornoXml);

  return {
    resumo: {
      ...resumoParcial,
      iteracoes: 1,
      quantidadeDocumentos: documentos.length
    },
    documentos
  };
}

/**
 * Cria instância axios com mTLS usando certificado A1.
 */
function criarClienteAxios(baseURL: string, pfx: Buffer, passphrase: string): AxiosInstance {
  const httpsAgent = new https.Agent({
    pfx,
    passphrase,
    // Em produção manter true; em homologação pode ser ajustado se houver problema de cadeia:
    rejectUnauthorized: true
  });

  return axios.create({
    baseURL,
    httpsAgent,
    timeout: 60000,
    headers: {
      "Content-Type": "application/soap+xml; charset=utf-8"
    }
  });
}

/**
 * Loop incremental para buscar todas as DF-e até maxNSU.
 */
async function executarFetchAll(args: {
  axiosInstance: AxiosInstance;
  cnpj: string;
  tpAmb: string;
  maxIteracoes: number;
}): Promise<ResultadoDistribuicao> {
  const { axiosInstance, cnpj, tpAmb, maxIteracoes } = args;

  let ultNSUAtual = "000000000000000";
  let maxNSU = "";
  let iteracoes = 0;
  const todosDocumentos: DocumentoDistribuido[] = [];

  while (iteracoes < maxIteracoes) {
    iteracoes++;

    const distNSUFragment = `<distNSU><ultNSU>${ultNSUAtual}</ultNSU></distNSU>`;
    const xmlBody = montarXmlDistDFeInt({ cnpj, tpAmb, distNSUFragment });
    const envelope = enveloparSoap(xmlBody);

    const retornoXml = await enviarDistribuicao(axiosInstance, envelope);
    const resumo = extrairResumoDistribuicao(retornoXml);
    const documentos = extrairDocumentosDistribuidos(retornoXml);

    if (resumo.codigoStatus !== "138" && resumo.codigoStatus !== "137" && resumo.codigoStatus !== "139") {
      return {
        resumo: {
          ...resumo,
          iteracoes,
          quantidadeDocumentos: todosDocumentos.length
        },
        documentos: todosDocumentos
      };
    }

    if (documentos.length > 0) {
      todosDocumentos.push(...documentos);
    }

    ultNSUAtual = resumo.ultNSU || ultNSUAtual;
    maxNSU = resumo.maxNSU || maxNSU;

    if (!maxNSU || ultNSUAtual >= maxNSU) {
      break;
    }
  }

  return {
    resumo: {
      codigoStatus: "138",
      motivo:
        "Busca incremental concluída até o último NSU disponível ou até o limite de iterações configurado.",
      ultNSU: ultNSUAtual,
      maxNSU: maxNSU || ultNSUAtual,
      iteracoes,
      quantidadeDocumentos: todosDocumentos.length
    },
    documentos: todosDocumentos
  };
}

/**
 * Envia envelope SOAP para SEFAZ e retorna XML como string.
 */
async function enviarDistribuicao(axiosInstance: AxiosInstance, envelope: string): Promise<string> {
  console.log("=== DEBUG SEFAZ REQUEST ===");
  console.log("Envelope XML being sent:");
  console.log(envelope.substring(0, 2000));
  console.log("=== END DEBUG REQUEST ===");

  try {
    const { status, data, headers } = await axiosInstance.post("", envelope);

    console.log("=== DEBUG SEFAZ RESPONSE ===");
    console.log("Status:", status);
    console.log("Headers:", headers);
    console.log("Data:", typeof data === "string" ? data.substring(0, 1000) : String(data).substring(0, 1000));
    console.log("=== END DEBUG ===");

    if (status >= 200 && status < 300) {
      return typeof data === "string" ? data : String(data);
    }

    const error: any = new Error("Resposta HTTP inválida da SEFAZ.");
    error.code = "SEFAZ_HTTP_ERROR";
    error.isOperational = true;
    error.statusCode = status;
    throw error;
  } catch (err: any) {
    console.log("=== DEBUG SEFAZ ERROR ===");
    console.log("Error message:", err.message);
    console.log("Error code:", err.code);
    console.log("Error response status:", err.response?.status);
    console.log("Error response data:", typeof err.response?.data === "string" ? err.response?.data.substring(0, 1000) : String(err.response?.data || "").substring(0, 1000));
    console.log("=== END DEBUG ===");

    const error: any = new Error("Erro ao comunicar com o Web Service da SEFAZ.");
    error.code = "SEFAZ_COMM_ERROR";
    error.isOperational = true;
    error.statusCode = 502;
    error.original = sanitizeError(err);
    throw error;
  }
}

function montarDistNSUFragment(params: { nsu?: string; ultNSU?: string }): string {
  const { nsu, ultNSU } = params;

  if (nsu && nsu.length > 0) {
    return `<distNSU><NSU>${nsu}</NSU></distNSU>`;
  }

  return `<distNSU><ultNSU>${ultNSU || "000000000000000"}</ultNSU></distNSU>`;
}

function montarXmlDistDFeInt(args: {
  cnpj: string;
  tpAmb: string;
  distNSUFragment: string;
}): string {
  const { cnpj, tpAmb, distNSUFragment } = args;

  return `
    <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
      <tpAmb>${tpAmb}</tpAmb>
      <cUFAutor>91</cUFAutor>
      <xServ>NFeDistribuicaoDFe</xServ>
      <CNPJ>${cnpj}</CNPJ>
      ${distNSUFragment}
    </distDFeInt>
  `.trim();
}

/**
 * Envelopa distDFeInt em SOAP 1.2 (similar ao node-mde).
 */
function enveloparSoap(innerXml: string): string {
  return `
    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                     xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
      <soap12:Body>
        <nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
          ${innerXml}
        </nfeDistDFeInteresse>
      </soap12:Body>
    </soap12:Envelope>
  `.trim();
}

/**
 * Parser simplificado de resumo (homologação).
 */
function extrairResumoDistribuicao(xml: string): {
  codigoStatus: string;
  motivo: string;
  ultNSU: string;
  maxNSU: string;
} {
  const get = (tag: string): string => {
    const regex = new RegExp(`<${tag}>([^<]+)</${tag}>`);
    const match = xml.match(regex);
    return match ? match[1] : "";
  };

  return {
    codigoStatus: get("cStat"),
    motivo: get("xMotivo"),
    ultNSU: get("ultNSU"),
    maxNSU: get("maxNSU")
  };
}

/**
 * Extrai docZip como metadados + base64 (sem unzip).
 */
function extrairDocumentosDistribuidos(xml: string): DocumentoDistribuido[] {
  const docs: DocumentoDistribuido[] = [];
  const regex = /<docZip[^>]*NSU="([^"]+)"[^>]*schema="([^"]+)"[^>]*>([^<]+)<\/docZip>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    const nsu = match[1];
    const schema = match[2];
    const conteudoZipBase64 = match[3];

    docs.push({
      nsu,
      schema,
      conteudoZipBase64
    });
  }

  return docs;
}

/**
 * Sanitiza erros sem expor segredos.
 */
function sanitizeError(err: any): Record<string, unknown> {
  if (!err) return {};
  return {
    message: err.message || "erro",
    code: err.code,
    name: err.name
  };
}