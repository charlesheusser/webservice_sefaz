"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const pino_http_1 = __importDefault(require("pino-http"));
const cors_1 = __importDefault(require("cors"));
const nfe_routes_1 = require("./transport/http/nfe.routes");
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "1mb" }));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: false
}));
const logger = (0, pino_http_1.default)({
    transport: process.env.NODE_ENV !== "production" ? { target: "pino-pretty" } : undefined,
    redact: {
        paths: [
            "req.headers.authorization",
            "req.body.*.senha",
            "req.body.*.password",
            "res.body.*.chaveAcesso",
            "res.body.*.cnpj",
            "res.body.*.cpf"
        ],
        remove: true
    }
});
app.use(logger);
// Healthcheck simples (sem acessar SEFAZ)
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        time: new Date().toISOString()
    });
});
// Rotas NFe (consulta distribuicao DF-e)
app.use("/api/nfe", nfe_routes_1.nfeRouter);
// Tratamento de erros genérico com resposta padronizada
app.use((err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    req.log?.error({
        err,
        path: req.path
    }, "Unhandled error");
    if (err && err.isOperational && err.statusCode) {
        return res.status(err.statusCode).json({
            error: err.code || "OPERATIONAL_ERROR",
            message: err.message
        });
    }
    return res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "Erro interno inesperado. Consulte os logs de auditoria."
    });
});
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const host = "0.0.0.0";
app.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`Webservice SEFAZ NFe iniciado em http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
});
