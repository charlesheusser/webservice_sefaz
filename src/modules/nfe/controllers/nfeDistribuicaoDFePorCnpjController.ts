import { Request, Response } from "express";
import { getSefazWsUrl, Ambiente } from "../../../config/sefazConfig";
import { executarNFeDistribuicaoDFePorCnpj } from "../services/nfeDistribuicaoDFeService";

/**
 * Controller HTTP para consulta NFeDistribuicaoDFe por CNPJ.
 *
 * Responsabilidades:
 * - Extrair e validar parâmetros de alto nível (já passaram por express-validator).
 * - Definir ambiente (homologação/prod) e UF alvo.
 * - Invocar a camada de serviço responsável por falar com a SEFAZ.
 * - Padronizar resposta segura, sem expor segredos ou detalhes internos.
 */
export async function nfeDistribuicaoDFePorCnpjController(req: Request, res: Response): Promise<void> {
  const cnpj = String(req.query.cnpj);
  const ultNSU = req.query.ultNSU ? String(req.query.ultNSU) : undefined;
  const nsu = req.query.nsu ? String(req.query.nsu) : undefined;
  const uf = req.query.uf ? String(req.query.uf) : undefined;

  const ambienteParam = (req.query.ambiente as string) || process.env.SEFAZ_AMBIENTE || "homologacao";
  const ambiente: Ambiente = ambienteParam === "producao" ? "producao" : "homologacao";

  try {
    const sefazUrl = getSefazWsUrl(uf, ambiente);

    const resultado = await executarNFeDistribuicaoDFePorCnpj({
      cnpj,
      ultNSU,
      nsu,
      sefazUrl,
      ambiente
    });

    res.json({
      sucesso: true,
      ambiente,
      uf: uf || "AN",
      resumo: resultado.resumo,
      documentos: resultado.documentos
    });
  } catch (error: any) {
    // Log detalhado via pino-http já disponível em req.log, sem expor segredos ao cliente.
    req.log?.error(
      {
        err: error,
        cnpj,
        uf: uf || "AN",
        ambiente
      },
      "Erro na integração com NFeDistribuicaoDFe"
    );

    const status = error.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 502;

    res.status(status).json({
      sucesso: false,
      error: error.code || "SEFAZ_INTEGRATION_ERROR",
      message:
        error.message ||
        "Falha ao consultar a SEFAZ. Consulte os logs internos para detalhes. Nenhum dado sensível foi exposto."
    });
  }
}