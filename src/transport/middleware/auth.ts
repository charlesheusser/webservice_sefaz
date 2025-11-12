import { NextFunction, Request, Response } from "express";

/**
 * Middleware de autenticação/autorização.
 *
 * Implementação atual: API Key simples via cabeçalho X-API-Key.
 * Em produção, recomendo integrar com o provedor corporativo (OAuth2/JWT/IdP),
 * mantendo este ponto como único guardião de acesso ao uso do certificado/SEFAZ.
 *
 * NUNCA exponha o certificado, senha ou detalhes de infraestrutura na resposta.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const expectedApiKey = process.env.API_KEY;

  if (!expectedApiKey) {
    // Falha de configuração crítica (não retornar detalhes sensíveis ao cliente).
    res.status(500).json({
      error: "CONFIGURATION_ERROR",
      message: "Configuração de segurança não inicializada."
    });
    return;
  }

  const providedApiKey = req.header("x-api-key");

  if (!providedApiKey || providedApiKey !== expectedApiKey) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Credenciais inválidas ou ausentes."
    });
    return;
  }

  next();
}