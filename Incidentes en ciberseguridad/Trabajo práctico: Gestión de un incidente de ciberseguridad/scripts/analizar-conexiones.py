#!/usr/bin/env python3
"""
analizar-conexiones.py  -  Analisis de conexiones sospechosas
--------------------------------------------------------------------
Proyecto: TP Gestion de incidente - Nexora S.L.  (Fer1399)
Apartado 3: Investigacion y analisis.

Lee el log del servidor C2 (`c2-server.py`, que registra tambien los
BYTES recibidos en cada POST) y:
  - Separa beacon (GET) de exfiltracion (POST).
  - Identifica el ORIGEN de cada peticion (la IP del cliente que se
    conecto al C2). Como el log es el del PROPIO servidor C2, el destino
    es implicito: todo lo que figura en el log son peticiones que RECIBIO
    el atacante; el parametro --atacante solo descarta la linea interna
    del propio servidor.
  - Suma los BYTES realmente recibidos en los POST: eso es lo que
    confirma la exfiltracion, no la mera existencia de la peticion.

USO:
    python3 analizar-conexiones.py c2.log --atacante 10.10.10.100
    python3 analizar-conexiones.py c2.log --atacante 10.10.10.100 --destino 10.10.10.100
"""
import sys
import re
from collections import Counter


def arg(nombre, defecto=None):
    return sys.argv[sys.argv.index(nombre) + 1] if nombre in sys.argv else defecto


def main():
    if len(sys.argv) < 2 or sys.argv[1].startswith("--"):
        print(__doc__)
        sys.exit(1)

    log = sys.argv[1]
    ip_atacante = arg("--atacante", "10.10.10.100")
    # IP del servidor C2 que registro el log (destino de las conexiones).
    # Por defecto es la del propio atacante.
    ip_destino = arg("--destino", ip_atacante)

    try:
        with open(log, encoding="utf-8", errors="ignore") as f:
            lineas = f.read().splitlines()
    except FileNotFoundError:
        print(f"[!] No existe el fichero de log: {log}")
        sys.exit(1)

    # Formato de c2-server.py / http.server:
    # 10.10.10.50 - - [15/Nov/2026 02:30:05] "POST /exfil.csv HTTP/1.1" 200 1234
    patron = re.compile(
        r'(\d+\.\d+\.\d+\.\d+).*?"(\w+)\s+(\S+)\s+HTTP/[\d.]+"\s+(\d+)\s+(\S+)'
    )

    beacons, exfil, origenes = [], [], Counter()
    bytes_exfiltrados = 0
    descartadas = 0

    for ln in lineas:
        m = patron.search(ln)
        if not m:
            continue
        ip, metodo, ruta, codigo, tam = m.groups()
        # Solo cuentan las conexiones de un host hacia el C2 (peticiones
        # entrantes registradas por el servidor del atacante).
        if ip == ip_destino:
            continue  # la propia linea informativa del C2, no es un cliente
        origenes[ip] += 1
        if metodo.upper() == "GET" and "beacon" in ruta.lower():
            beacons.append((ip, ruta, codigo))
        elif metodo.upper() == "POST":
            n = int(tam) if tam.isdigit() else 0
            exfil.append((ip, ruta, codigo, n))
            if codigo == "200":
                bytes_exfiltrados += n

    print(f"[*] Analizando {log}")
    print(f"    IP del atacante / C2: {ip_destino}\n")

    print("=== Origenes de las conexiones (clientes del C2) ===")
    for ip, n in origenes.most_common():
        marca = "  <-- VICTIMA" if ip != ip_destino else ""
        print(f"  {ip:16} {n} peticiones{marca}")

    print("\n=== Beacon / C2 (comunicacion periodica) ===")
    for ip, ruta, cod in beacons:
        print(f"  [BEACON] {ip} -> GET {ruta}  (HTTP {cod})")
    print(f"  Total beacons: {len(beacons)}  (patron periodico = C2, MITRE T1071)")

    print("\n=== Exfiltracion de datos (POST recibidos) ===")
    for ip, ruta, cod, n in exfil:
        estado = "RECIBIDO Y ALMACENADO" if cod == "200" else f"HTTP {cod}"
        print(f"  [EXFIL] {ip} -> POST {ruta}  {n} bytes  [{estado}]")
    print(f"  Total exfiltrado: {bytes_exfiltrados} bytes en {len(exfil)} POST")

    print("\n[+] Conclusion:")
    if bytes_exfiltrados > 0:
        print(f"    CONFIRMADO: el C2 ({ip_destino}) recibio y almaceno "
              f"{bytes_exfiltrados} bytes exfiltrados desde la victima.")
        print("    Tecnicas: C2 (T1071) y exfiltracion por el canal C2 (T1041).")
    elif exfil:
        print("    INDICADOR: hay peticiones POST, pero ninguna confirma datos "
              "almacenados (revisar codigos de respuesta).")
    else:
        print("    No se detectaron conexiones de exfiltracion en el log.")


if __name__ == "__main__":
    main()
