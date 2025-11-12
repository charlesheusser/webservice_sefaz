export type Ambiente = "homologacao" | "producao";

export interface SefazWsConfig {
  nfeDistribuicaoDFe: string;
}

export interface SefazConfigPorUf {
  uf: string;
  ambientes: Record<Ambiente, SefazWsConfig>;
}

/**
 * Configuração centralizada e facilmente auditável dos endpoints SEFAZ.
 * URLs abaixo são placeholders EXEMPLIFICATIVOS e DEVEM ser validados/atualizados
 * com a documentação oficial vigente da NFe no momento da implantação.
 *
 * Não codificar credenciais ou dados sensíveis aqui.
 */
export const sefazConfigs: SefazConfigPorUf[] = [
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

export function getSefazWsUrl(uf: string | undefined, ambiente: Ambiente): string {
  const ufNormalized = (uf || "AN").toUpperCase();

  const config =
    sefazConfigs.find((c) => c.uf === ufNormalized) ||
    sefazConfigs.find((c) => c.uf === "AN");

  if (!config) {
    throw new Error(`Configuração SEFAZ não encontrada para UF=${ufNormalized}`);
  }

  return config.ambientes[ambiente].nfeDistribuicaoDFe;
}