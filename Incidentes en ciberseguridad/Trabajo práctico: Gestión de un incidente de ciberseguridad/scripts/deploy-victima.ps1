<#
=====================================================================
 deploy-victima.ps1
 ---------------------------------------------------------------------
 Proyecto : TP Gestion de un incidente de ciberseguridad (Nexora S.L.)
 Autor    : Luis Fernando Arrosquipa (GitHub: Fer1399)
 Apartado : 2 - Deteccion y auditoria
 Objetivo : Dejar la VM VICTIMA (PC-RRHH-01) preparada para generar
            telemetria de calidad: Sysmon + agente Wazuh + recursos
            compartidos y datos ficticios de clientes.

 USO (PowerShell como Administrador):
    Set-ExecutionPolicy -Scope Process Bypass -Force
    .\deploy-victima.ps1 -WazuhManager 10.10.10.20

 ENTORNO: ejecutar SOLO en la VM de laboratorio, dentro de la red
          aislada de VirtualBox (Red NAT 'nexora-lab', 10.10.10.0/24).
          No ejecutar en un equipo real. Datos de clientes = inventados.
=====================================================================
#>

param(
    [string]$WazuhManager = "10.10.10.20",   # IP del SRV-SIEM (Wazuh)
    [string]$WorkDir      = "C:\Lab",         # Carpeta de trabajo del lab
    [string]$ShareName    = "RRHH_Compartido" # Recurso compartido "sensible"
)

$ErrorActionPreference = "Stop"

function Write-Paso($txt) {
    Write-Host "`n[+] $txt" -ForegroundColor Cyan
}
function Write-Ok($txt) {
    Write-Host "    OK  $txt" -ForegroundColor Green
}

# --- 0. Comprobacion de privilegios -----------------------------------
if (-not ([Security.Principal.WindowsPrincipal] `
        [Security.Principal.WindowsIdentity]::GetCurrent()
    ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Este script debe ejecutarse como Administrador."
}

Write-Paso "Creando estructura de carpetas en $WorkDir"
New-Item -ItemType Directory -Force -Path $WorkDir, "$WorkDir\tools", "$WorkDir\logs" | Out-Null
Write-Ok "Carpetas creadas"

# --- 1. Sysmon + configuracion de deteccion ---------------------------
# Sysmon (Sysinternals) registra creacion de procesos, conexiones de red,
# creacion de ficheros y cambios de registro. Es la fuente nº1 de evidencias.
Write-Paso "Descargando e instalando Sysmon"
$sysmonZip = "$WorkDir\tools\Sysmon.zip"
$sysmonDir = "$WorkDir\tools\Sysmon"
try {
    Invoke-WebRequest -Uri "https://download.sysinternals.com/files/Sysmon.zip" `
        -OutFile $sysmonZip -UseBasicParsing
    Expand-Archive -Path $sysmonZip -DestinationPath $sysmonDir -Force
    Write-Ok "Sysmon descargado"
} catch {
    Write-Host "    AVISO: sin internet en la VM. Copia Sysmon manualmente en $sysmonDir" -ForegroundColor Yellow
}

# Config recomendada (base SwiftOnSecurity, estandar en la industria).
Write-Paso "Descargando configuracion de Sysmon (SwiftOnSecurity)"
$sysmonConf = "$WorkDir\tools\sysmonconfig.xml"
try {
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/SwiftOnSecurity/sysmon-config/master/sysmonconfig-export.xml" `
        -OutFile $sysmonConf -UseBasicParsing
    Write-Ok "Config descargada"
} catch {
    Write-Host "    AVISO: descarga manual la config en $sysmonConf" -ForegroundColor Yellow
}

if (Test-Path "$sysmonDir\Sysmon64.exe") {
    & "$sysmonDir\Sysmon64.exe" -accepteula -i $sysmonConf
    Write-Ok "Sysmon instalado y configurado"
}

# --- 2. Politica de auditoria de Windows ------------------------------
# Activa el registro de inicios de sesion (4624/4625), acceso a objetos
# y creacion de procesos con linea de comandos (4688). Imprescindible
# para el apartado 3 (investigacion).
Write-Paso "Habilitando politica de auditoria avanzada"
auditpol /set /category:"Logon/Logoff"      /success:enable /failure:enable | Out-Null
auditpol /set /category:"Detailed Tracking"  /success:enable /failure:enable | Out-Null
auditpol /set /category:"Object Access"      /success:enable /failure:enable | Out-Null
# Guardar la linea de comandos en el evento 4688
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit" `
    /v ProcessCreationIncludeCmdLine_Enabled /t REG_DWORD /d 1 /f | Out-Null
Write-Ok "Auditoria avanzada activada (4624/4625/4688/acceso a objetos)"

# --- 3. Recurso compartido "sensible" con datos ficticios -------------
# El atacante intentara acceder a esta carpeta en el apartado 3.
Write-Paso "Creando recurso compartido '$ShareName' con datos ficticios"
$sharePath = "$WorkDir\$ShareName"
New-Item -ItemType Directory -Force -Path $sharePath | Out-Null

# CSV de clientes INVENTADOS (ningun dato real).
$clientes = @"
id,nombre,email,telefono,dni_ficticio,saldo
1001,Ana Prueba,ana.prueba@nexora.lab,600000001,00000001X,1240.50
1002,Luis Demo,luis.demo@nexora.lab,600000002,00000002Y,980.00
1003,Marta Test,marta.test@nexora.lab,600000003,00000003Z,3150.75
1004,Juan Ejemplo,juan.ejemplo@nexora.lab,600000004,00000004W,540.20
1005,Sara Ficticia,sara.ficticia@nexora.lab,600000005,00000005V,7820.00
"@
Set-Content -Path "$sharePath\clientes_CONFIDENCIAL.csv" -Value $clientes -Encoding UTF8

# Minimo privilegio: NO se comparte con "Everyone/FullAccess". Se concede
# solo lectura a los usuarios autenticados (SID S-1-5-11, valido en cualquier
# idioma de Windows); en un dominio real se restringiria al grupo de RR. HH.
if (-not (Get-SmbShare -Name $ShareName -ErrorAction SilentlyContinue)) {
    New-SmbShare -Name $ShareName -Path $sharePath `
        -ReadAccess "S-1-5-11" | Out-Null
}
# Refuerzo en NTFS: retira la herencia abierta y deja solo lectura al mismo grupo
$acl = Get-Acl $sharePath
$acl.SetAccessRuleProtection($true, $false)
$regla = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "S-1-5-11", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.AddAccessRule($regla)
Set-Acl $sharePath $acl
Write-Ok "Compartido creado (solo lectura, usuarios autenticados): \\$env:COMPUTERNAME\$ShareName"

# --- 4. Agente Wazuh --------------------------------------------------
# Envia toda la telemetria (Sysmon, eventos de seguridad) al SIEM central.
Write-Paso "Instalando agente Wazuh apuntando a $WazuhManager"
$wazuhMsi = "$WorkDir\tools\wazuh-agent.msi"
try {
    Invoke-WebRequest -Uri "https://packages.wazuh.com/4.x/windows/wazuh-agent-4.9.2-1.msi" `
        -OutFile $wazuhMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$wazuhMsi`" /q WAZUH_MANAGER=`"$WazuhManager`" WAZUH_AGENT_NAME=`"PC-RRHH-01`"" -Wait
    & "C:\Program Files (x86)\ossec-agent\bin\wazuh-control.exe" start 2>$null
    Write-Ok "Agente Wazuh instalado y arrancado"
} catch {
    Write-Host "    AVISO: instala el MSI de Wazuh manualmente (WAZUH_MANAGER=$WazuhManager)" -ForegroundColor Yellow
}

# --- 5. Recordar a Wazuh que lea el canal de Sysmon -------------------
Write-Paso "Configurando el agente para recoger el canal de Sysmon"
$ossecConf = "C:\Program Files (x86)\ossec-agent\ossec.conf"
if (Test-Path $ossecConf) {
    $bloque = @"
  <localfile>
    <location>Microsoft-Windows-Sysmon/Operational</location>
    <log_format>eventchannel</log_format>
  </localfile>
"@
    (Get-Content $ossecConf -Raw) -replace "</ossec_config>", "$bloque`n</ossec_config>" |
        Set-Content $ossecConf -Encoding UTF8
    & "C:\Program Files (x86)\ossec-agent\bin\wazuh-control.exe" restart 2>$null
    Write-Ok "Canal de Sysmon añadido a ossec.conf"
}

Write-Host "`n=====================================================" -ForegroundColor Magenta
Write-Host " VICTIMA LISTA. Comprueba en el dashboard de Wazuh" -ForegroundColor Magenta
Write-Host " que el agente 'PC-RRHH-01' aparece como Activo." -ForegroundColor Magenta
Write-Host "=====================================================" -ForegroundColor Magenta
