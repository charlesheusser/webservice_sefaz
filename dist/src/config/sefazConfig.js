"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sefazConfigs = void 0;
exports.getSefazWsUrl = getSefazWsUrl;
/**
 * Configuração centralizada e facilmente auditável dos endpoints SEFAZ.
 * URLs abaixo são placeholders EXEMPLIFICATIVOS e DEVEM ser validados/atualizados
 * com a documentação oficial vigente da NFe no momento da implantação.
 *
 * Não codificar credenciais ou dados sensíveis aqui.
 */
exports.sefazConfigs = [
    {
        uf: "AN", // Ambiente Nacional / SVC / SVRS - ajustar conforme docs oficiais
        ambientes: {
            homologacao: {
                nfeDistribuicaoDFe: "https://hom.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx"
            },
            producao: {
                nfeDistribuicaoDFe: "https://www.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx"
            }
        }
    }
    // Adicionar aqui outras UFs/SVRS/SVAN conforme necessidade do projeto.
];
function getSefazWsUrl(uf, ambiente) {
    const ufNormalized = (uf || "AN").toUpperCase();
    const config = exports.sefazConfigs.find((c) => c.uf === ufNormalized) ||
        exports.sefazConfigs.find((c) => c.uf === "AN");
    if (!config) {
        throw new Error(`Configuração SEFAZ não encontrada para UF=${ufNormalized}`);
    }
    return config.ambientes[ambiente].nfeDistribuicaoDFe;
}
