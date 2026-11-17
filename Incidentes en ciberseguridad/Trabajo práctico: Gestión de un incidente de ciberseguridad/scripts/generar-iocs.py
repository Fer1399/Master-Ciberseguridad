#!/usr/bin/env python3
"""
generar-iocs.py  -  Calculo de hashes e inventario de IOCs/evidencias
--------------------------------------------------------------------
Proyecto: TP Gestion de incidente - Nexora S.L.  (Fer1399)
Apartado 3: Investigacion y analisis  /  Preservacion de integridad.

Recorre una carpeta de evidencias, calcula MD5 y SHA-256 de cada
fichero y genera:
  - iocs.csv        (tabla de indicadores de compromiso)
  - iocs.md         (mismo listado en Markdown para la memoria)

El SHA-256 es la "huella" que garantiza la INTEGRIDAD de la evidencia
(funcion hash del apartado 1) y el que se consulta en VirusTotal.

USO:
    python3 generar-iocs.py /ruta/a/evidencias
    python3 generar-iocs.py .            (carpeta actual)
"""
import sys, os, hashlib, csv, datetime


def hashes_de(ruta: str):
    md5 = hashlib.md5()
    sha = hashlib.sha256()
    with open(ruta, "rb") as f:
        for bloque in iter(lambda: f.read(65536), b""):
            md5.update(bloque)
            sha.update(bloque)
    return md5.hexdigest(), sha.hexdigest()


def main():
    carpeta = sys.argv[1] if len(sys.argv) > 1 else "."
    if not os.path.isdir(carpeta):
        print(f"[!] No existe la carpeta: {carpeta}"); sys.exit(1)

    filas = []
    for raiz, _, ficheros in os.walk(carpeta):
        for nombre in ficheros:
            if nombre in ("iocs.csv", "iocs.md"):
                continue
            ruta = os.path.join(raiz, nombre)
            try:
                md5, sha = hashes_de(ruta)
                filas.append({
                    "fichero": os.path.relpath(ruta, carpeta),
                    "tamano_bytes": os.path.getsize(ruta),
                    "md5": md5,
                    "sha256": sha,
                })
            except Exception as e:
                print(f"[!] Error con {ruta}: {e}")

    if not filas:
        print("[!] No se encontraron ficheros."); sys.exit(0)

    # CSV
    with open("iocs.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["fichero", "tamano_bytes", "md5", "sha256"])
        w.writeheader(); w.writerows(filas)

    # Markdown
    fecha = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("iocs.md", "w", encoding="utf-8") as f:
        f.write(f"# Tabla de IOCs / evidencias\nGenerado: {fecha}\n\n")
        f.write("| Fichero | Tamano (bytes) | SHA-256 |\n|---|---|---|\n")
        for r in filas:
            f.write(f"| {r['fichero']} | {r['tamano_bytes']} | `{r['sha256']}` |\n")

    print(f"[+] {len(filas)} evidencias procesadas.")
    print("[+] Generados: iocs.csv  e  iocs.md")
    for r in filas:
        print(f"    {r['fichero']:30}  SHA256={r['sha256']}")


if __name__ == "__main__":
    main()
