#!/usr/bin/env python3
"""
cadena-custodia.py  -  Registro de cadena de custodia de evidencias
--------------------------------------------------------------------
Proyecto: TP Gestion de incidente - Nexora S.L.  (Fer1399)
Apartado 3: Investigacion y analisis  /  Cadena de custodia.

Registra cada evidencia con su SHA-256, ruta absoluta, tamano,
fecha/hora y la persona que la recoge. Mejoras frente a la version
inicial:
  - Identifica cada evidencia por su RUTA ABSOLUTA (no solo el nombre),
    de modo que dos ficheros con el mismo nombre no se confunden.
  - Controla errores: fichero inexistente o argumentos incompletos.
  - Protege el propio libro: tras cada cambio calcula el SHA-256 del
    JSON y lo guarda en `cadena-custodia.sha256`. El comando `sello`
    comprueba que el libro no se ha modificado por fuera.

USO:
    python3 cadena-custodia.py add <ruta> --quien "L.F. Arrosquipa" --desc "..."
    python3 cadena-custodia.py verify <ruta>      # la evidencia no ha cambiado
    python3 cadena-custodia.py sello               # el LIBRO no ha cambiado
    python3 cadena-custodia.py list
"""
import sys
import os
import hashlib
import json
import datetime

LIBRO = "cadena-custodia.json"
SELLO = "cadena-custodia.sha256"


def sha256_fichero(ruta):
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        for b in iter(lambda: f.read(65536), b""):
            h.update(b)
    return h.hexdigest()


def sha256_texto(txt):
    return hashlib.sha256(txt.encode("utf-8")).hexdigest()


def cargar():
    if os.path.exists(LIBRO):
        with open(LIBRO, encoding="utf-8") as f:
            return json.load(f)
    return []


def guardar(reg):
    texto = json.dumps(reg, indent=2, ensure_ascii=False)
    with open(LIBRO, "w", encoding="utf-8") as f:
        f.write(texto)
    # Sella el propio libro: su hash queda fuera, para detectar manipulaciones
    with open(SELLO, "w", encoding="utf-8") as f:
        f.write(sha256_texto(texto) + "\n")
    with open("cadena-custodia.md", "w", encoding="utf-8") as f:
        f.write("# Cadena de custodia de evidencias\n\n")
        f.write("| # | Evidencia | Ruta | SHA-256 | Tamano | Recogida por | Fecha/hora | Descripcion |\n")
        f.write("|---|---|---|---|---|---|---|---|\n")
        for i, e in enumerate(reg, 1):
            f.write(f"| {i} | {e['fichero']} | `{e['ruta']}` | `{e['sha256']}` | "
                    f"{e['tamano']} | {e['recogida_por']} | {e['fecha']} | {e['descripcion']} |\n")


def pedir_ruta():
    if len(sys.argv) < 3:
        print("[!] Falta la ruta de la evidencia.")
        sys.exit(1)
    ruta = sys.argv[2]
    if not os.path.isfile(ruta):
        print(f"[!] No existe el fichero: {ruta}")
        sys.exit(1)
    return ruta


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    accion = sys.argv[1]
    reg = cargar()

    if accion == "add":
        ruta = pedir_ruta()
        abs_ruta = os.path.abspath(ruta)
        quien = sys.argv[sys.argv.index("--quien") + 1] if "--quien" in sys.argv else "desconocido"
        desc = sys.argv[sys.argv.index("--desc") + 1] if "--desc" in sys.argv else ""
        e = {
            "fichero": os.path.basename(ruta),
            "ruta": abs_ruta,
            "sha256": sha256_fichero(ruta),
            "tamano": os.path.getsize(ruta),
            "recogida_por": quien,
            "fecha": datetime.datetime.now().isoformat(timespec="seconds"),
            "descripcion": desc,
        }
        reg.append(e)
        guardar(reg)
        print(f"[+] Evidencia registrada: {e['fichero']}  ({abs_ruta})")
        print(f"    SHA-256: {e['sha256']}")

    elif accion == "verify":
        ruta = pedir_ruta()
        abs_ruta = os.path.abspath(ruta)
        actual = sha256_fichero(ruta)
        # Busca SOLO por ruta absoluta. No se usa el nombre como respaldo: dos
        # evidencias con el mismo nombre en carpetas distintas no deben confundirse,
        # y un respaldo por nombre podria seleccionar la entrada equivocada.
        entrada = next((e for e in reg if e["ruta"] == abs_ruta), None)
        if not entrada:
            print(f"[!] {abs_ruta} no esta en el libro de custodia.")
            return
        ok = entrada["sha256"] == actual
        print(f"[{'OK' if ok else '!!'}] {entrada['fichero']}  ({entrada['ruta']})")
        print(f"    Registrado: {entrada['sha256']}")
        print(f"    Actual:     {actual}")
        print("    => INTEGRIDAD INTACTA" if ok else "    => EVIDENCIA ALTERADA")

    elif accion == "sello":
        # Verifica que el propio LIBRO no se haya modificado por fuera
        if not (os.path.exists(LIBRO) and os.path.exists(SELLO)):
            print("[!] No hay libro o sello que comprobar.")
            return
        actual = sha256_texto(open(LIBRO, encoding="utf-8").read())
        guardado = open(SELLO, encoding="utf-8").read().strip()
        ok = actual == guardado
        print(f"[{'OK' if ok else '!!'}] Sello del libro de custodia")
        print(f"    Sellado: {guardado}")
        print(f"    Actual:  {actual}")
        print("    => LIBRO INTEGRO" if ok else "    => EL LIBRO HA SIDO MODIFICADO")

    elif accion == "list":
        if not reg:
            print("[*] Libro de custodia vacio.")
            return
        for i, e in enumerate(reg, 1):
            print(f"{i}. {e['fichero']}  ({e['fecha']}, {e['recogida_por']})")
            print(f"   Ruta:    {e['ruta']}")
            print(f"   SHA-256: {e['sha256']}")
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
