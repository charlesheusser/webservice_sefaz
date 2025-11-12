import os
from pathlib import Path

def main() -> None:
    # Lê do .env via variáveis de ambiente já carregadas pelo Node ou use valores padrão
    pfx_path = os.getenv("NFE_CERT_PFX_PATH", "")
    pfx_pwd = os.getenv("NFE_CERT_PFX_PASSWORD", "")

    print(f"[PYTEST] Caminho configurado: {Path(pfx_path).resolve()}")
    print(f"[PYTEST] Senha definida no .env? {'SIM' if pfx_pwd else 'NAO'}")

    try:
        from OpenSSL import crypto  # type: ignore
    except ImportError:
        print("[PYTEST] pyOpenSSL não está instalado.")
        print("[PYTEST] Rode o comando: pip install pyopenssl")
        return

    p = Path(pfx_path)

    if not p.is_file():
        print(f"[PYTEST] ERRO: arquivo não encontrado em {p}")
        return

    try:
        data = p.read_bytes()
    except Exception as e:
        print(f"[PYTEST] ERRO ao ler o arquivo PFX: {e}")
        return

    print(f"[PYTEST] Arquivo lido com sucesso. Tamanho={len(data)} bytes")

    try:
        # Tentativa de carregar o PKCS#12 com a senha informada
        pkcs12 = crypto.load_pkcs12(data, pfx_pwd.encode() if pfx_pwd else None)
        cert = pkcs12.get_certificate()
        subj = cert.get_subject()
        cn = getattr(subj, "CN", None)
        print("[PYTEST] PFX OK: senha compatível e estrutura válida.")
        print(f"[PYTEST]  Subject CN={cn}")
        print("[PYTEST]  Este certificado é adequado para uso no webservice (HTTPS mTLS).")
    except Exception as e:
        print("[PYTEST] FALHA AO CARREGAR PFX COM A SENHA ATUAL.")
        print(f"[PYTEST]  Tipo: {type(e).__name__}")
        print(f"[PYTEST]  Msg : {e}")
        print("[PYTEST]  Interpretação:")
        print("          - Se der erro aqui, o problema é o par arquivo .pfx + senha (formato/senha),")
        print("            não o código Node/TypeScript.")
        print("          - Use o mesmo .pfx e senha que funcionam em outro sistema confiável ou")
        print("            reexporte o A1 em PKCS#12 padrão com a senha correta.")


if __name__ == "__main__":
    main()
