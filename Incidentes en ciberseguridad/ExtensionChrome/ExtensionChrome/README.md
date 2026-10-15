# 🛡️ CyberCoach: extensión de Chrome para formar en ciberseguridad

Extensión de Chrome (Manifest V3) para formar a la plantilla de una empresa en ciberseguridad. Combina micro-cursos con quiz, gamificación y **avisos contextuales en el momento de riesgo**: webs que imitan a la empresa, formularios de contraseña sin HTTPS y descargas peligrosas.

Esta versión es el **MVP sin backend**: todo funciona en local y no hace falta servidor.

## Funcionalidades

| Módulo | Qué incluye |
|---|---|
| 🎓 **Formación** | 7 micro-cursos (phishing, contraseñas y MFA, ingeniería social, navegación segura, dispositivos y teletrabajo, RGPD, incidentes) con lecciones, quiz (aprobado ≥ 80 %), feedback explicado y certificado imprimible |
| ⚠️ **Avisos contextuales** | Banner en la página si el dominio imita al corporativo o a marcas conocidas (Microsoft, PayPal, bancos…), si usa punycode o IP directa, o si pide contraseña por HTTP. Notificación si se descarga un archivo ejecutable o con doble extensión |
| 🎣 **Reporte de phishing** | Botón en el popup y en los avisos. Abre un email ya redactado al equipo de seguridad con la URL |
| 🏆 **Gamificación** | Puntos, 5 niveles, insignias y racha de días |
| 💡 **Píldora semanal** | Notificación con un consejo de seguridad |
| ⚙️ **Gestión empresarial** | Configuración por política de Chrome (`chrome.storage.managed`): nombre de empresa, dominios corporativos, email de reporte y bloqueo de ajustes |

## Instalación (modo desarrollador)

1. Descomprime el zip.
2. Abre `chrome://extensions` en Chrome.
3. Activa **Modo de desarrollador** (arriba a la derecha).
4. Pulsa **Cargar descomprimida** y selecciona la carpeta `ExtensionChrome`.
5. Se abrirá la página de bienvenida. Ve a **Ajustes** (icono de la extensión → Ajustes) y escribe tus dominios corporativos y el email de seguridad.

## Despliegue en la empresa

### 1. Publicar
- Empaqueta la carpeta y publícala en la **Chrome Web Store** como *privada/no listada* para tu dominio de Google Workspace. También puedes alojar el `.crx` en un servidor propio.

### 2. Instalación forzada
- **Google Workspace**: Consola de administración → Dispositivos → Chrome → Aplicaciones y extensiones → añadir por ID → *Forzar instalación*.
- **Windows (GPO o Intune)**: política `ExtensionInstallForcelist` con `<ID>;https://clients2.google.com/service/update2/crx`.

### 3. Configuración gestionada
Define la política de la extensión (esquema en `managed_schema.json`). Ejemplo en JSON para la consola de Google o para Intune:

```json
{
  "companyName": { "Value": "ACME S.L." },
  "corporateDomains": { "Value": ["acme.com", "acme.es"] },
  "reportEmail": { "Value": "seguridad@acme.com" },
  "detectorEnabled": { "Value": true },
  "lockSettings": { "Value": true }
}
```

En Windows (registro): `HKLM\Software\Policies\Google\Chrome\3rdparty\extensions\<ID>\policy`.

## Personalización

- **Contenido de los cursos**: `data/modules.json`. Se puede editar sin programar. Cada módulo tiene `lessons` (con `text`, `bullets` y `example`) y `quiz` (con `q`, `options`, `answer` empezando en 0 y `explain`). Admite `**negrita**` y `` `código` ``.
- **Consejos semanales**: `data/tips.json`.
- **Colores corporativos**: variables `--brand*` en `shared/theme.css`.
- **Puntos, niveles e insignias**: `shared/storage.js`.
- **Marcas vigiladas y extensiones de riesgo**: `shared/detector-rules.js`.

## Estructura

```
ExtensionChrome/
├── manifest.json            Manifest V3
├── managed_schema.json      Esquema de la política empresarial
├── background/service-worker.js   Mensajes, píldora semanal, avisos de descarga, reporte
├── content/detector.js      Banner de aviso en páginas sospechosas
├── popup/                   Popup: nivel, progreso, insignias, botón de reporte
├── course/                  Página de formación: lecciones, quiz, certificado
├── options/                 Ajustes, exportar o reiniciar progreso
├── shared/                  Estado, reglas del detector y tema visual
├── data/                    Contenidos (módulos y consejos)
├── assets/icons/
└── tests/                   Tests de las reglas del detector (node --test tests/*.test.js)
```

## Privacidad

- El análisis de páginas se hace **en local**. No se guarda ni se envía el historial de navegación.
- No se leen ni se guardan contraseñas.
- El progreso se guarda en `chrome.storage.local` del propio navegador.
- Antes del despliegue, informa a la plantilla (RGPD, art. 13) y consúltalo con el DPO.

## Hoja de ruta

- **Fase 2**: alerta de reutilización de la contraseña corporativa (hash local), más reglas de detección y listas de bloqueo de amenazas.
- **Fase 3**: backend con SSO (Google o Microsoft Entra ID) y panel de administración con métricas por departamento.
- **Fase 4**: simulacros de phishing, campañas e informes de cumplimiento (ISO 27001, ENS, NIS2).
