"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nfeRouter = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validateRequest_1 = require("../middleware/validateRequest");
const auth_1 = require("../middleware/auth");
const nfeDistribuicaoDFePorCnpjController_1 = require("../../modules/nfe/controllers/nfeDistribuicaoDFePorCnpjController");
exports.nfeRouter = (0, express_1.Router)();
/**
 * Endpoint: Consulta distribuicao DF-e (NFeDistribuicaoDFe) por CNPJ.
 *
 * Segurança:
 * - Protegido por authMiddleware (API Key ou integração corporativa).
 * - Parâmetros validados por express-validator.
 *
 * Funcional:
 * - Suporta fetchAll para buscar todas as NSU disponíveis para o CNPJ do certificado.
 */
exports.nfeRouter.get("/distribuicao", auth_1.authMiddleware, [
    (0, express_validator_1.query)("cnpj")
        .isLength({ min: 14, max: 14 })
        .withMessage("cnpj deve conter 14 dígitos numéricos.")
        .matches(/^[0-9]+$/)
        .withMessage("cnpj deve conter apenas números."),
    (0, express_validator_1.query)("ultNSU")
        .optional()
        .isLength({ min: 1, max: 15 })
        .withMessage("ultNSU inválido."),
    (0, express_validator_1.query)("nsu")
        .optional()
        .isLength({ min: 1, max: 15 })
        .withMessage("nsu inválido."),
    (0, express_validator_1.query)("ambiente")
        .optional()
        .isIn(["homologacao", "producao"])
        .withMessage("ambiente inválido. Use 'homologacao' ou 'producao'."),
    (0, express_validator_1.query)("uf")
        .optional()
        .isLength({ min: 2, max: 2 })
        .withMessage("UF inválida."),
    (0, express_validator_1.query)("pagina")
        .optional()
        .isInt({ min: 1 })
        .withMessage("pagina deve ser inteiro >= 1."),
    (0, express_validator_1.query)("limite")
        .optional()
        .isInt({ min: 1, max: 250 })
        .withMessage("limite deve ser inteiro entre 1 e 250."),
    (0, express_validator_1.query)("fetchAll")
        .optional()
        .isIn(["true", "false"])
        .withMessage("fetchAll deve ser 'true' ou 'false'.")
], validateRequest_1.validateRequest, nfeDistribuicaoDFePorCnpjController_1.nfeDistribuicaoDFePorCnpjController);
