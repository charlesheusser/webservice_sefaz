"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
const express_validator_1 = require("express-validator");
/**
 * Middleware genérico para validar requisições usando express-validator.
 * Garante resposta padronizada e segura (sem exposição de detalhes internos).
 */
function validateRequest(req, res, next) {
    const result = (0, express_validator_1.validationResult)(req);
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
