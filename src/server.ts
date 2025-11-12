import "dotenv/config";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import cors from "cors";
import { nfeRouter } from "./transport/http/nfe.routes";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(helmet());
app.use(
  cors({
    origin: false
  })
);

const logger = pinoHttp({
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
app.use("/api/nfe", nfeRouter);

// Tratamento de erros genérico com resposta padronizada
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction
  ) => {
    req.log?.error(
      {
        err,
        path: req.path
      },
      "Unhandled error"
    );

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
  }
);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const host = "0.0.0.0";

app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Webservice SEFAZ NFe iniciado em http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
});