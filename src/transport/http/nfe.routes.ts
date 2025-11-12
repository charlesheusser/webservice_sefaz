import { Router } from "express";
import { query } from "express-validator";
import { validateRequest } from "../middleware/validateRequest";
import { authMiddleware } from "../middleware/auth";
import { nfeDistribuicaoDFePorCnpjController } from "../../modules/nfe/controllers/nfeDistribuicaoDFePorCnpjController";

export const nfeRouter = Router();

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

nfeRouter.get(
  "/distribuicao",
  authMiddleware,
  [
    query("cnpj")
      .isLength({ min: 14, max: 14 })
      .withMessage("cnpj deve conter 14 dígitos numéricos.")
      .matches(/^[0-9]+$/)
      .withMessage("cnpj deve conter apenas números."),
    query("ultNSU")
      .optional()
      .isLength({ min: 1, max: 15 })
      .withMessage("ultNSU inválido."),
    query("nsu")
      .optional()
      .isLength({ min: 1, max: 15 })
      .withMessage("nsu inválido."),
    query("ambiente")
      .optional()
      .isIn(["homologacao", "producao"])
      .withMessage("ambiente inválido. Use 'homologacao' ou 'producao'."),
    query("uf")
      .optional()
      .isLength({ min: 2, max: 2 })
      .withMessage("UF inválida."),
    query("pagina")
      .optional()
      .isInt({ min: 1 })
      .withMessage("pagina deve ser inteiro >= 1."),
    query("limite")
      .optional()
      .isInt({ min: 1, max: 250 })
      .withMessage("limite deve ser inteiro entre 1 e 250."),
    query("fetchAll")
      .optional()
      .isIn(["true", "false"])
      .withMessage("fetchAll deve ser 'true' ou 'false'.")
  ],
  validateRequest,
  nfeDistribuicaoDFePorCnpjController
);