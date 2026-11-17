#!/usr/bin/env python3
"""
osint-lookup.py  -  Investigacion OSINT de IOCs (IP / dominio / hash)
--------------------------------------------------------------------
Proyecto: TP Gestion de incidente - Nexora S.L.  (Fer1399)
Apartado 3: Investigacion y analisis.

Consulta la reputacion de una IP, dominio o hash en VirusTotal y
AbuseIPDB. Util para investigar la "IP externa del atacante" y el
hash SHA-256 que Sysmon capturo del binario ejecutado.

USO:
    python3 osint-lookup.py 10.10.10.100
    python3 osint-lookup.py A220A85750588F5B231FF8CB106BA5409EAABB85E3DD7278A98FCA907E171ED2
    python3 osint-lookup.py dominio-malicioso.com

Claves API (gratuitas): ponlas como variables de entorno o aqui abajo.
    export VT_API_KEY="tu_clave_virustotal"
    export ABUSEIPDB_API_KEY="tu_clave_abuseipdb"
"""
import sys, os, re, json
import urllib.request, urllib.error

VT_API_KEY = os.getenv("VT_API_KEY", "PON_AQUI_TU_CLAVE_VIRUSTOTAL")
ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY", "PON_AQUI_TU_CLAVE_ABUSEIPDB")


def tipo_ioc(valor: str) -> str:
    if re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", valor):
        return "ip"
    if re.fullmatch(r"[A-Fa-f0-9]{32}", valor):
        return "hash"      # MD5
    if re.fullmatch(r"[A-Fa-f0-9]{40}", valor):
        return "hash"      # SHA1
    if re.fullmatch(r"[A-Fa-f0-9]{64}", valor):
        return "hash"      # SHA256
    return "dominio"


def http_get(url: str, headers: dict) -> dict:
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.reason}"}
    except Exception as e:
        return {"error": str(e)}


def consulta_virustotal(ioc: str, tipo: str) -> None:
    print("\n=== VirusTotal ===")
    if "PON_AQUI" in VT_API_KEY:
        print("  [!] Falta la clave VT_API_KEY (gratuita en virustotal.com).")
        return
    ruta = {"ip": "ip_addresses", "dominio": "domains", "hash": "files"}[tipo]
    url = f"https://www.virustotal.com/api/v3/{ruta}/{ioc}"
    data = http_get(url, {"x-apikey": VT_API_KEY})
    if "error" in data:
        print("  [!]", data["error"]); return
    stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
    mal = stats.get("malicious", 0); sus = stats.get("suspicious", 0)
    total = sum(stats.values()) if stats else 0
    print(f"  Deteccciones maliciosas: {mal}/{total}  (sospechosas: {sus})")
    veredicto = "MALICIOSO" if mal > 0 else ("SOSPECHOSO" if sus > 0 else "limpio/desconocido")
    print(f"  Veredicto: {veredicto}")


def consulta_abuseipdb(ioc: str) -> None:
    print("\n=== AbuseIPDB ===")
    if "PON_AQUI" in ABUSEIPDB_API_KEY:
        print("  [!] Falta la clave ABUSEIPDB_API_KEY (gratuita en abuseipdb.com).")
        return
    url = f"https://api.abuseipdb.com/api/v2/check?ipAddress={ioc}&maxAgeInDays=90"
    data = http_get(url, {"Key": ABUSEIPDB_API_KEY, "Accept": "application/json"})
    if "error" in data:
        print("  [!]", data["error"]); return
    d = data.get("data", {})
    print(f"  Puntuacion de abuso: {d.get('abuseConfidenceScore', '?')}%")
    print(f"  Pais: {d.get('countryCode', '?')}  ISP: {d.get('isp', '?')}")
    print(f"  Denuncias totales: {d.get('totalReports', '?')}")


def main():
    if len(sys.argv) != 2:
        print(__doc__); sys.exit(1)
    ioc = sys.argv[1].strip()
    tipo = tipo_ioc(ioc)
    print(f"[*] IOC: {ioc}  ->  tipo detectado: {tipo}")
    consulta_virustotal(ioc, tipo)
    if tipo == "ip":
        consulta_abuseipdb(ioc)
    print("\n[+] Consulta OSINT finalizada.")


if __name__ == "__main__":
    main()
