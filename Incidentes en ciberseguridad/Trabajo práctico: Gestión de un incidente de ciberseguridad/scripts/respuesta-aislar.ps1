<#
    respuesta-aislar.ps1
    Script de respuesta y contencion de un incidente (Nexora S.L. - laboratorio)
    Autor: Luis Fernando Arrosquipa

    Objetivo: ante la deteccion de la intrusion en PC-RRHH-01, ejecutar de forma
    ordenada y trazable los primeros pasos de respuesta:
      1. Recoger evidencia volatil ANTES de tocar nada (orden de volatilidad).
      2. Bloquear la comunicacion con el atacante (regla de firewall).
      3. Aislar el equipo de la red (deshabilitar adaptadores).
      4. Sellar toda la evidencia con SHA-256 para la cadena de custodia.

    Uso (PowerShell como Administrador en el equipo comprometido):
      .\respuesta-aislar.ps1 -IPAtacante 10.10.10.100

    Nota: entorno de laboratorio autorizado. El aislamiento corta la red del equipo;
    ejecutar desde consola local, no por sesion remota.
#>

param(
    [string]$IPAtacante = "10.10.10.100",
    [string]$CarpetaEvidencias = "C:\Evidencias_Incidente"
)

$ErrorActionPreference = "Continue"
$sello = Get-Date -Format "yyyyMMdd_HHmmss"
$dir   = Join-Path $CarpetaEvidencias $sello
New-Item -ItemType Directory -Path $dir -Force | Out-Null

function Log($txt) {
    $linea = "[{0}] {1}" -f (Get-Date -Format "HH:mm:ss"), $txt
    Write-Host $linea
    Add-Content -Path (Join-Path $dir "respuesta.log") -Value $linea
}

Log "=== INICIO DE LA RESPUESTA AL INCIDENTE ==="
Log "Equipo: $env:COMPUTERNAME  |  Usuario: $env:USERNAME"
Log "IP del atacante a bloquear: $IPAtacante"
Log "Carpeta de evidencias: $dir"

# ------------------------------------------------------------------
# PASO 1 - EVIDENCIA VOLATIL (se recoge primero: se pierde al apagar/aislar)
# ------------------------------------------------------------------
Log "--- PASO 1: recogida de evidencia volatil ---"

# Conexiones de red activas (clave para ver el C2 / exfiltracion)
Get-NetTCPConnection -ErrorAction SilentlyContinue |
    Select-Object State,LocalAddress,LocalPort,RemoteAddress,RemotePort,OwningProcess |
    Sort-Object RemoteAddress |
    Export-Csv -NoTypeInformation -Path (Join-Path $dir "conexiones.csv")
Log "Conexiones de red guardadas (conexiones.csv)"

# Resaltar cualquier conexion con el atacante
$malas = Get-NetTCPConnection -ErrorAction SilentlyContinue |
         Where-Object { $_.RemoteAddress -eq $IPAtacante }
if ($malas) {
    $malas | Out-File (Join-Path $dir "conexiones_atacante.txt")
    Log ("[!] Detectadas {0} conexiones hacia {1}" -f $malas.Count, $IPAtacante)
} else {
    Log "No hay conexiones activas hacia el atacante en este instante"
}

# Procesos en ejecucion (con ruta del ejecutable)
Get-Process | Select-Object Id,ProcessName,Path,StartTime |
    Export-Csv -NoTypeInformation -Path (Join-Path $dir "procesos.csv")
Log "Procesos en ejecucion guardados (procesos.csv)"

# Usuarios con sesion iniciada
quser 2>$null | Out-File (Join-Path $dir "sesiones.txt")

# Tareas programadas (posible persistencia)
Get-ScheduledTask | Select-Object TaskName,State,TaskPath |
    Export-Csv -NoTypeInformation -Path (Join-Path $dir "tareas_programadas.csv")
Log "Tareas programadas guardadas (persistencia)"

# Cache ARP y tabla de rutas (contexto de red)
arp -a   | Out-File (Join-Path $dir "arp.txt")
route print | Out-File (Join-Path $dir "rutas.txt")

# ------------------------------------------------------------------
# PASO 2 - BLOQUEO DE LA COMUNICACION CON EL ATACANTE
# ------------------------------------------------------------------
Log "--- PASO 2: bloqueo del atacante en el firewall ---"
New-NetFirewallRule -DisplayName "IR-BLOQUEO-ATACANTE-SALIDA" -Direction Outbound `
    -RemoteAddress $IPAtacante -Action Block -Profile Any -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "IR-BLOQUEO-ATACANTE-ENTRADA" -Direction Inbound `
    -RemoteAddress $IPAtacante -Action Block -Profile Any -ErrorAction SilentlyContinue | Out-Null
Log "Reglas de firewall creadas para bloquear $IPAtacante (entrada y salida)"

# ------------------------------------------------------------------
# PASO 3 - AISLAMIENTO DEL EQUIPO
# ------------------------------------------------------------------
Log "--- PASO 3: aislamiento de red del equipo ---"
$adaptadores = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
foreach ($a in $adaptadores) {
    Log ("Deshabilitando adaptador: {0}" -f $a.Name)
    Disable-NetAdapter -Name $a.Name -Confirm:$false -ErrorAction SilentlyContinue
}
Log "Equipo aislado de la red. La evidencia ya esta recogida en local."

# ------------------------------------------------------------------
# PASO 4 - SELLADO DE LA EVIDENCIA (SHA-256) PARA LA CADENA DE CUSTODIA
# ------------------------------------------------------------------
Log "--- PASO 4: sellado de evidencia con SHA-256 ---"
# IMPORTANTE: primero cerramos el log (ultimas anotaciones) y SOLO despues
# calculamos los hashes, para que el SHA-256 de respuesta.log corresponda a
# su estado FINAL. El propio SHA256SUMS.txt se excluye del calculo.
Log "=== RESPUESTA COMPLETADA ==="
Log "Siguiente paso manual: revocar credenciales de rrhh.ana en el AD,"
Log "restaurar PC-RRHH-01 desde un snapshot verificado como limpio (comparar su"
Log "hash/fecha con la linea base previa al incidente) y notificar (AEPD/CERT)."

# A partir de aqui NO se vuelve a escribir en respuesta.log.
$hashes = Get-ChildItem -Path $dir -File |
    Where-Object { $_.Name -ne "SHA256SUMS.txt" } | ForEach-Object {
        $h = Get-FileHash $_.FullName -Algorithm SHA256
        "{0}  {1}" -f $h.Hash, $_.Name
    }
$hashes | Out-File (Join-Path $dir "SHA256SUMS.txt")

Write-Host ""
Write-Host "Evidencia y log en: $dir" -ForegroundColor Green
Write-Host "Integridad sellada en SHA256SUMS.txt (respuesta.log incluido en su estado final)." -ForegroundColor Green
