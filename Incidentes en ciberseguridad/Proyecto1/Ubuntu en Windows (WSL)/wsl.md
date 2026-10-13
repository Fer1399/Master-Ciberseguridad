# Ubuntu en Windows WSL

## Objetivo

Instalar Ubuntu en Windows mediante el Subsistema de Windows para Linux (WSL), que permite ejecutar un entorno Linux directamente en Windows sin necesidad de configurar una máquina virtual tradicional.

## Paso 1. Habilitar el Subsistema de Windows para Linux

1. Abrir el menú **Inicio** de Windows y buscar **Activar o desactivar las características de Windows**.
2. Abrir la herramienta de características de Windows.
3. Marcar la opción **Subsistema de Windows para Linux** (*Windows Subsystem for Linux*).
4. Si el sistema lo solicita, habilitar también los componentes necesarios para la plataforma de virtualización.
5. Pulsar **Aceptar** y esperar a que Windows aplique los cambios.

## Paso 2. Reiniciar el equipo

Una vez habilitadas las características necesarias, reiniciar Windows para que los cambios se apliquen correctamente.

## Paso 3. Instalar Ubuntu desde Microsoft Store

1. Abrir **Microsoft Store**.
2. Buscar **Ubuntu**.
3. Seleccionar la distribución de Ubuntu que se vaya a utilizar en las prácticas e instalarla.
4. Cuando termine la instalación, abrir Ubuntu desde el menú **Inicio**.
5. En el primer inicio, esperar a que se complete la configuración inicial y seguir las instrucciones que aparezcan en pantalla para crear el usuario y la contraseña de Linux.

> **Nota:** la contraseña de Linux puede no mostrarse mientras se escribe en la terminal. Es un comportamiento normal.

## Evidencia de la instalación

<img width="1913" height="489" alt="image" src="https://github.com/user-attachments/assets/6e18cc71-1dfb-4979-a2ac-2c82e865ebc1" />

**Figura 1.** Ubuntu instalado y ejecutándose en Windows mediante WSL. La captura sirve como evidencia visual de que la distribución se ha instalado y se ha iniciado correctamente.

## Resultado

Se ha habilitado el Subsistema de Windows para Linux y se ha instalado Ubuntu desde Microsoft Store. Una vez completada la configuración inicial, el entorno queda preparado para realizar las prácticas de Linux desde Windows.
