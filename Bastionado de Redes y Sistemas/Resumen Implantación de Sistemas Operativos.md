# Implantación de Sistemas Operativos

Repaso de los conceptos del módulo, organizados por temas (en vez de alfabéticamente) para que se entiendan juntos. Al final hay tablas resumen de clasificación, RAID y arquitecturas.

---

## 1. ¿Qué es un sistema operativo?

El **sistema operativo (SO)** es el software base que gestiona el hardware y el software de un equipo y da una plataforma sobre la que ejecutar aplicaciones. Sus funciones principales: **gestión de procesos, memoria, sistema de ficheros, dispositivos de E/S y seguridad**.

Tres categorías de software que conviene distinguir:

| Tipo | Qué hace | Ejemplos |
|---|---|---|
| **Software de sistema** | Gestiona el hardware | SO, drivers, utilidades, firmware |
| **Software de aplicación** | Tareas del usuario final | Word, navegador, cliente de correo |
| **Software de programación** | Crear programas | Compiladores, IDE, Git, depuradores |

Conceptos clave del interior del SO:

- **Kernel (núcleo):** el componente central; gestiona hardware, procesos, memoria y ficheros. Opera en el nivel de privilegio más alto (**anillo 0**).
- **Anillos (rings):** niveles de privilegio. El anillo 0 (kernel) tiene acceso total al hardware; los procesos de usuario corren en el **anillo 3** (el más restringido).
- **Interfaz de usuario:** puede ser **CLI** (línea de comandos: terminal, cmd, PowerShell) o **GUI** (gráfica: ventanas e iconos).
- **E/S (Entrada/Salida):** cómo el equipo intercambia información con el exterior; el SO la gestiona con drivers y ofrece una interfaz unificada.

---

## 2. Arquitecturas del SO

La **arquitectura** define cómo se organizan los componentes internos del SO:

| Arquitectura | Idea | Ejemplo |
|---|---|---|
| **Monolítica** | Todo el kernel en un mismo espacio de memoria. Rápida, menos modular | Linux |
| **Microkernel** | El kernel mínimo; lo demás, fuera. Más modular y seguro | Minix, QNX |
| **Híbrida** | Mezcla de las dos | Windows NT, macOS (XNU) |
| **Por capas / anillos** | Niveles que solo hablan con los adyacentes | — |
| **Cliente-servidor** | Un servidor central da servicios a varios clientes | — |
| **Máquina virtual** | El SO se ejecuta sobre una emulación de hardware | — |
| **Distribuido** | Recursos repartidos en varios nodos que actúan como uno | Amoeba, Plan 9 |

---

## 3. Clasificación de los sistemas operativos

| Criterio | Categorías | Ejemplos |
|---|---|---|
| **Nº de usuarios** | Monousuario / Multiusuario | MS-DOS · Linux, Windows Server |
| **Gestión de tareas** | Monotarea / Multitarea | DOS · Windows, macOS, Linux |
| **Distribución** | Centralizado / Distribuido | Windows local · Amoeba, Plan 9 |
| **Procesadores** | Uniprocesador / Multiprocesador (SMP) | Embebidos · Linux SMP, Windows |
| **Licencia** | Libre / Propietario | Ubuntu, Debian · Windows, macOS |
| **Modo de arranque** | Instalable / Autoarrancable (live) | Ubuntu Desktop · Knoppix, Tails |
| **Arquitectura** | Monolítica / Microkernel / Híbrida | Linux · Minix · Windows NT |

> **Multitarea preferente vs cooperativa:** en la **preferente** el SO decide cuándo quita la CPU a un proceso (lo normal hoy); en la **cooperativa** cada proceso cede voluntariamente el control (más frágil).

---

## 4. Gestión de procesos y memoria

- **Multiprogramación:** mantener varios programas en memoria; mientras uno espera una E/S, la CPU ejecuta otro. Aprovecha mejor la CPU.
- **Multitarea:** ejecutar varios procesos de forma aparentemente simultánea conmutando rápido la CPU.
- **Tiempo compartido (time-sharing):** reparte porciones de tiempo de CPU entre varios usuarios a la vez (UNIX fue pionero).
- **Planificación de procesos (scheduling):** decide qué proceso usa la CPU y cuánto. Algoritmos: **FIFO, Round Robin, Prioridad, Shortest Job First**. Busca maximizar el uso de CPU y minimizar la espera.
- **Memoria RAM:** guarda temporalmente datos e instrucciones en ejecución. El SO la gestiona con **paginación, segmentación y memoria virtual**.

---

## 5. Arranque del sistema

El orden al encender: **firmware → gestor de arranque → kernel**.

- **BIOS / UEFI:** firmware que se ejecuta al encender, hace el **POST** e inicia el arranque. **UEFI** es el sucesor moderno de BIOS: soporta discos **GPT**, **Secure Boot** (arranque seguro) e interfaz gráfica, y es necesario para SO modernos de 64 bits.
- **Gestor de arranque (boot loader):** carga el SO en RAM y, si hay varios, muestra un menú. Ejemplos: **GRUB2** (Linux), **Windows Boot Manager / BOOTMGR** (que guarda su config en el **BCD** y se gestiona con `bcdedit.exe`).
- **Ficheros de arranque:** en Windows, `bootmgr`, BCD y `winload.exe`; en Linux, los de GRUB, el kernel (`vmlinuz`) y el disco RAM inicial (`initrd`).

> **Orden de instalación en multiboot:** primero el más "egoísta" (**Windows**) y después **Linux**, porque GRUB detecta Windows y lo añade al menú, pero el gestor de Windows no reconoce Linux.

- **Reparación del gestor de arranque:** en Windows, `bootrec.exe` desde WinRE; en Linux, arrancar desde un LiveCD y `grub-install` en entorno chroot.
- **Disco de recuperación:** soporte con un entorno mínimo para reparar sin reinstalar (WinRE en Windows; `fsck`, chroot o modo rescate en Linux).

---

## 6. Discos, particiones y sistemas de ficheros

### 6.1. Particiones

Una **partición** es una división lógica del disco, cada una con su sistema de ficheros. El **formato de la tabla de particiones** puede ser:

| | **MBR** (Master Boot Record) | **GPT** (GUID Partition Table) |
|---|---|---|
| Particiones | Hasta 4 primarias | Hasta 128 |
| Tamaño de disco | Hasta 2 TB | Mucho mayor |
| Asociado a | BIOS clásica | UEFI (moderno) |

> El **MBR** son los primeros 512 bytes del disco (código de arranque + tabla). **GPT** lo está sustituyendo y duplica la tabla al inicio y al final para mayor redundancia.

Herramientas: `fdisk`, `parted`, **GParted** (Linux) o el Administrador de discos (Windows). El **redimensionado** cambia el tamaño sin destruir datos (`resize2fs`, GParted), pero es delicado: copia de seguridad antes.

### 6.2. Sistemas de ficheros

Definen cómo se organizan los datos. Los más comunes:

| Sistema | Uso |
|---|---|
| **NTFS** | Windows |
| **ext4** | Linux |
| **FAT32** | Universal pero limitado (archivos < 4 GB) |
| **exFAT** | USB y tarjetas |
| **Btrfs / ZFS** | Avanzados: instantáneas y RAID integrado |

- **Punto de montaje:** carpeta vacía donde se integra otro sistema de ficheros. En Linux se monta con `mount` y se automatiza en `/etc/fstab`; `/boot`, `/home`, `/var` son puntos de montaje habituales.
- **Volumen:** unidad lógica que puede abarcar varias particiones. En Linux, **LVM** (gestor de volúmenes lógicos) permite extender en caliente; en Windows, volúmenes dinámicos.
- **Cuota de disco:** límite de espacio por usuario, con nivel de aviso (*warning*) antes del máximo.
- **Compresión:** reduce tamaño (sin pérdida o con pérdida); NTFS y Btrfs la aplican de forma transparente.
- **Desfragmentación:** reordena los fragmentos en discos **magnéticos**. **En SSD no se hace** (desgasta y no mejora nada).

### 6.3. RAID (tolerancia a fallos y rendimiento)

Combina varios discos físicos. Niveles más usados:

| Nivel | Qué hace | Mín. discos | Tolera fallos | Uso típico |
|---|---|---|---|---|
| **RAID 0** | Distribución (striping) | 2 | Ninguna | Edición de vídeo |
| **RAID 1** | Espejo (mirroring) | 2 | 1 disco | Sistemas críticos |
| **RAID 5** | Paridad distribuida | 3 | 1 disco | Servidores de ficheros |
| **RAID 6** | Doble paridad | 4 | 2 discos | Almacenamiento crítico |
| **RAID 10** | Espejo + distribución | 4 | 1 por grupo | Bases de datos |
| **RAID 50** | RAID 5 + distribución | 6 | 1 por grupo | Grandes volúmenes |

> RAID 0 solo busca rendimiento (si cae un disco, se pierde todo). RAID 1 es el espejo más simple. RAID 5/6 equilibran capacidad y seguridad con paridad.

---

## 7. Instalación de sistemas operativos

El proceso completo: **verificar requisitos → preparar particiones → arrancar el instalador → configurar el sistema → instalar controladores** (y configuración post-instalación).

- **Requisitos hardware:** CPU, RAM, disco, gráficos y red mínimos/recomendados. Verificarlos antes evita problemas.
- **Instalación desatendida:** se ejecuta sin intervención, guiada por un **fichero de respuestas** (`autounattend.xml` en Windows, `preseed` en Debian). Clave para desplegar cientos de equipos iguales sin errores humanos.
- **Imagen de servidor:** copia exacta del estado completo de un servidor (SO + apps + config + datos) para restaurarlo entero en otro hardware o MV.
- **Número de licencia / clave de producto:** código que autoriza la instalación de software propietario (en Windows, **Product Key** de 25 caracteres).

---

## 8. Usuarios, permisos y seguridad local

- **Cuenta de usuario:** entidad que se autentica; tiene un identificador único (**SID** en Windows, **UID** en Linux), contraseña y permisos. Se separan cuentas estándar y administrativas (**mínimo privilegio**).
- **Grupo:** contenedor lógico de cuentas para asignar permisos de golpe.
- **Perfil de usuario:** sus configuraciones (escritorio, apps, preferencias). Puede ser **local**, **móvil** (en el servidor, se sincroniza) u **obligatorio** (solo lectura).

### Permisos

- **Permisos de acceso:** qué puede hacer cada usuario sobre un recurso (leer, escribir, ejecutar, borrar). En Linux, formato **octal** (`755`) o simbólico (`rwxr-xr-x`); en Windows, **ACL con permisos NTFS**.
- **ACL (Access Control List):** lista asociada a un recurso con los permisos de cada usuario/grupo. Es la base del modelo de seguridad en Windows y Linux.
- **Herencia de permisos:** los objetos heredan los permisos del contenedor padre (se puede bloquear para un control más fino).
- **Permisos de red vs locales:** sobre recursos compartidos (SMB/NFS). El permiso efectivo es la combinación de ambos: **prevalece el más restrictivo**.

### Contraseñas

- **Caducidad:** obliga a cambiarla cada cierto tiempo.
- **Bloqueo de cuenta:** la deshabilita tras N intentos fallidos (protege de fuerza bruta).
- **Algoritmo de contraseña segura:** reglas de longitud, mezcla de caracteres y comparación contra diccionarios filtrados.

- **Cifrado de discos:** **BitLocker** (Windows) y **LUKS** (Linux) cifran el disco completo; recomendados en portátiles por si hay robo o pérdida.

---

## 9. Active Directory y dominios

**Dominio vs grupo de trabajo:**

| | **Grupo de trabajo** (workgroup) | **Dominio** |
|---|---|---|
| Modelo | Entre iguales (peer-to-peer) | Centralizado |
| Usuarios | Cada equipo los gestiona | Base de datos central |
| Tamaño | Redes pequeñas (<10-15) | Empresas |

**Active Directory (AD)** es el servicio de directorio de Microsoft que implementa **LDAP** y da autenticación centralizada. Su estructura:

- **Dominio:** unidad básica de administración (nombre DNS único, p. ej. `empresa.local`).
- **Árbol:** varios dominios con espacio de nombres contiguo.
- **Bosque:** una o varias árboles; es el **límite de seguridad más amplio**.
- **Unidad Organizativa (OU):** contenedor para organizar objetos; ámbito natural de las GPO y de la delegación.
- **Sitio (Site):** estructura **física** (subredes con buena conectividad); optimiza la replicación.

Piezas importantes:

- **Controlador de dominio (DC):** servidor que aloja AD y autentica. Se recomiendan **al menos dos** con replicación.
- **GPO (Directiva de grupo):** configuraciones que el admin aplica de forma centralizada. Se aplican en orden **LSDOU** (Local → Sitio → Dominio → OU).
- **Catálogo global:** copia parcial de todos los objetos del bosque; acelera las búsquedas entre dominios.
- **Esquema:** define los tipos de objetos (clases) y atributos; único por bosque.
- **FSMO:** cinco roles únicos (Maestro de esquema, de nomenclatura, PDC Emulador, RID e Infraestructura).
- **LDAP:** protocolo de acceso al directorio (base de AD y de OpenLDAP).
- **Delegación de control:** dar permisos administrativos sobre una OU sin ser admin del dominio.
- **RSoP:** muestra el conjunto final de directivas aplicadas (para resolver conflictos).
- **CAL (Client Access License):** licencia para que un usuario/dispositivo acceda a un servidor (por usuario o por dispositivo).

---

## 10. Redes y recursos compartidos

- **Configuración TCP/IP:** IP, máscara, puerta de enlace y DNS. Estática o por **DHCP**.
- **Hostname:** nombre único del equipo en la red; con dominio, el **FQDN** (`pc01.empresa.local`).
- **Resolución de nombres (DNS):** traduce nombres a IP. Esencial en AD (los equipos localizan los DC por registros **SRV**). Una **zona DNS** es la porción del espacio de nombres que gestiona un servidor.

Protocolos para compartir ficheros:

| Protocolo | Mundo | Nota |
|---|---|---|
| **SMB / CIFS** | Windows | SMB3 cifra en tránsito |
| **NFS** | Unix/Linux | Monta directorios remotos |
| **Samba** | Linux hace de servidor SMB para clientes Windows (incluso como DC de AD) |

- **Firewall (cortafuegos):** filtra el tráfico según reglas; esencial en redes no seguras.
- **Administración / asistencia remota:** gestionar un equipo a distancia (SSH, RDP, TeamViewer/AnyDesk). La asistencia requiere consentimiento del usuario.

---

## 11. Virtualización

Crear representaciones virtuales de hardware por software para ejecutar varias **máquinas virtuales (MV)** en un solo equipo físico.

- **Hipervisor:** crea y gestiona las MV.
  - **Tipo 1 (bare-metal):** sobre el hardware directamente → VMware ESXi, Hyper-V, Proxmox.
  - **Tipo 2:** sobre un SO anfitrión → VirtualBox, VMware Workstation.
- **Host (anfitrión) vs Guest (invitado):** el host aloja el hipervisor; el guest es el SO que corre dentro de la MV.

> Ventajas de las MV: aislamiento, portabilidad y mejor aprovechamiento del hardware.

---

## 12. Copias de seguridad y recuperación

Tipos de **backup**:

| Tipo | Qué respalda | Restauración |
|---|---|---|
| **Completa** | Todo | Solo esa copia |
| **Diferencial** | Lo cambiado desde la última **completa** | Completa + última diferencial |
| **Incremental** | Lo cambiado desde la última copia (sea cual sea) | Completa + **todas** las incrementales en orden |

> La **incremental** ocupa menos y es más rápida de hacer, pero su restauración es más compleja. La **diferencial** es un punto intermedio.

- **Plan de copias:** documento formal (qué, cada cuánto, en qué soporte, cuánto se conserva, quién y cómo se verifica). Incluye el plan de restauración.
- **Ciclo de vida del backup:** planificar → ejecutar → **verificar** → documentar. No es puntual, es continuo. (Una copia que no se ha probado a restaurar no sirve.)
- **Punto de recuperación / restauración:** instantánea del estado del sistema antes de cambios importantes (Punto de restauración en Windows; instantáneas de Btrfs/ZFS en Linux).
- **Tolerancia a fallos:** seguir operando pese a fallos, con RAID, clustering, replicación y SAI/UPS.
- **Imagen de servidor:** para recuperar un servidor entero rápidamente.

---

## 13. Actualizaciones y licencias

- **Actualización (update):** instalar una versión más reciente (correcciones, funciones, parches). Puede ser de versión mayor, parche de seguridad, funcional u opcional.
- **Parche de seguridad:** corrige vulnerabilidades; se aplica **cuanto antes** para reducir la ventana de exposición.
- **Downgrade:** volver a una versión anterior (por incompatibilidades); más complejo y no siempre posible.
- **Fuente de actualizaciones:** de dónde se obtienen. En Windows, **WSUS** (servidor interno que centraliza y controla); en Linux, repositorios **APT, YUM/DNF o Zypper**.

Licencias de software:

| Tipo | Idea |
|---|---|
| **Copyright estricto** | Todos los derechos reservados |
| **Copyleft (GPL)** | Libre, obliga a mantener la libertad |
| **Permisivas (MIT, BSD, Apache)** | Libres, pocas restricciones |
| **Freeware** | Gratis, sin código fuente |
| **Shareware** | Prueba con pago posterior |
| **Dominio público** | Sin derechos reservados |

> **Software libre ≠ gratis.** Libre son las cuatro libertades (usar, estudiar, redistribuir, modificar); el ejemplo es la **GPL**. **SO libre:** Ubuntu, Debian, Fedora, FreeBSD. **SO propietario:** Windows, macOS.

---

## 14. Monitorización, logs y auditoría

- **Auditoría del sistema:** registrar y analizar eventos con fines de seguridad y detección de intrusiones. La directiva de **acceso a objetos** registra los intentos de acceso a recursos protegidos por ACL.
- **Log / registro de eventos:** fichero que guarda cronológicamente los eventos con su origen, prioridad (info, advertencia, error, crítico) y fecha. En Windows, **Visor de eventos**; en Linux, `syslogd`/`journald` en `/var/log`.
- **Herramienta de monitorización:** supervisa estado y rendimiento. En Windows: Monitor de recursos/rendimiento, Visor de eventos. En Linux: `top`, `htop`, `sar`, `vmstat`, Nagios, Zabbix.
- **Alerta:** aviso automático (correo, SMS) cuando un contador supera un umbral.

---

## 15. Otros conceptos sueltos

- **Controladores (drivers):** traducen entre el SO y el hardware. Su correcta instalación es crítica para rendimiento y estabilidad.
- **Registro de Windows (Registry):** base de datos jerárquica con la configuración del sistema; organizada en claves y *hives* (`HKEY_LOCAL_MACHINE`, `HKEY_CURRENT_USER`). Si se corrompe, puede impedir el arranque.
- **Variable de entorno:** par nombre-valor que configura el comportamiento de los procesos (`PATH`, `HOME`, `TEMP`).
- **Enlace (link):** en Linux, **hard link** (apunta al inodo) o **symlink** (apunta a la ruta y puede cruzar sistemas de ficheros).
- **Batch (proceso por lotes):** ejecutar tareas en secuencia sin intervención (hoy, tareas programadas como copias nocturnas).
- **Script de inicio de sesión:** se ejecuta al iniciar sesión; mapea unidades, sincroniza o configura el entorno. En dominio se asigna por GPO.
- **Estructura jerárquica de directorios:** árbol invertido con una raíz (`/` en Linux, `C:\` en Windows). Rutas **absolutas** (desde la raíz) o **relativas** (desde donde estás).

---

## Resumen: cinco distinciones que más caen

1. **MBR vs GPT** — 4 particiones y 2 TB (BIOS) frente a 128 particiones y discos enormes (UEFI).
2. **Hipervisor tipo 1 vs tipo 2** — sobre el hardware (ESXi, Hyper-V) frente a sobre un SO (VirtualBox).
3. **Copia completa / diferencial / incremental** — por lo que respaldan y lo que hace falta para restaurar.
4. **Dominio vs grupo de trabajo** — centralizado (AD) frente a entre iguales.
5. **Software libre ≠ gratis** — las cuatro libertades (GPL), no el precio.
