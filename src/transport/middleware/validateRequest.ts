import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

/**
 * Middleware genérico para validar requisições usando express-validator.
 * Garante resposta padronizada e segura (sem exposição de detalhes internos).
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const sanitizedErrors = result.array({ onlyFirstError: true }).map((err) => ({
    field: "param" in err ? err.param : err.type,
    message: err.msg
  }));

  res.status(400).json({
    error: "VALIDATION_ERROR",
    message: "Parâmetros inválidos.",
    details: sanitizedErrors
  });
}