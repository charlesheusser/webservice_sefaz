"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nfeDistribuicaoDFePorCnpjController = nfeDistribuicaoDFePorCnpjController;
const sefazConfig_1 = require("../../../config/sefazConfig");
const nfeDistribuicaoDFeService_1 = require("../services/nfeDistribuicaoDFeService");
/**
 * Controller HTTP para consulta NFeDistribuicaoDFe por CNPJ.
 *
 * Responsabilidades:
 * - Extrair e validar parâmetros de alto nível (já passaram por express-validator).
 * - Definir ambiente (homologação/prod) e UF alvo.
 * - Invocar a camada de serviço responsável por falar com a SEFAZ.
 * - Padronizar resposta segura, sem expor segredos ou detalhes internos.
 */
async function nfeDistribuicaoDFePorCnpjController(req, res) {
    const cnpj = String(req.query.cnpj);
    const ultNSU = req.query.ultNSU ? String(req.query.ultNSU) : undefined;
    const nsu = req.query.nsu ? String(req.query.nsu) : undefined;
    const uf = req.query.uf ? String(req.query.uf) : undefined;
    const ambienteParam = req.query.ambiente || process.env.SEFAZ_AMBIENTE || "homologacao";
    const ambiente = ambienteParam === "producao" ? "producao" : "homologacao";
    try {
        const sefazUrl = (0, sefazConfig_1.getSefazWsUrl)(uf, ambiente);
        const resultado = await (0, nfeDistribuicaoDFeService_1.executarNFeDistribuicaoDFePorCnpj)({
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
    }
    catch (error) {
        // Log detalhado via pino-http já disponível em req.log, sem expor segredos ao cliente.
        req.log?.error({
            err: error,
            cnpj,
            uf: uf || "AN",
            ambiente
        }, "Erro na integração com NFeDistribuicaoDFe");
        const status = error.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 502;
        res.status(status).json({
            sucesso: false,
            error: error.code || "SEFAZ_INTEGRATION_ERROR",
            message: error.message ||
                "Falha ao consultar a SEFAZ. Consulte os logs internos para detalhes. Nenhum dado sensível foi exposto."
        });
    }
}
