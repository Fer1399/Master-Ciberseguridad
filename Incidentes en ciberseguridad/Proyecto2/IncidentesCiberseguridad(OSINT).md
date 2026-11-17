# Análisis del incidente ferroviario de Urda (Toledo) – 28/10/2026

> Datos a 29/10/2026, sacados de fuentes abiertas. El juzgado de Orgaz ha decretado secreto de sumario, así que mucho de lo que se sabe viene de audios filtrados y declaraciones públicas.

## Resumen

Un AVE de Renfe chocó por detrás contra un Iryo parado en la línea Madrid–Sevilla, entre Los Yébenes y Urda. Antes había caído el LZB, el sistema de protección de la línea, que es de 1992. Con el LZB caído, el centro de control de Atocha dejó al AVE seguir en «marcha normal» cuando tocaba «marcha a la vista» (máximo 40 km/h). La última cifra publicada es de 74 fallecidos.

Nuestra hipótesis se sostiene a medias. Los datos respaldan que el origen está en equipos de los 90. No hay ningún indicio público de ciberataque, aunque nadie lo ha descartado oficialmente.

## 0. Registro

| Campo | Dato |
|---|---|
| ID | INC-2026-1028-001 |
| Incidente | Caída del LZB y choque entre el AVE 2080 y el Iryo 6076 |
| Fallo inicial | 28/10/2026, ~08:30 |
| Choque | 28/10/2026, 08:53–08:54 |
| Lugar | Km 118, vía 2, línea Madrid–Sevilla (Toledo) |
| Trenes | Iryo 6076 (147 personas) y AVE 2080 (397), los dos hacia Sevilla por la misma vía |
| Implicados | Adif (vía y control), Renfe e Iryo (trenes) |
| Estado | Abierto, en investigación |

**Cronología**

| Hora | Qué pasó |
|---|---|
| 07:54 / 08:00 | Salen de Atocha el Iryo y el AVE |
| ~08:30 | Cae el LZB por un fallo de comunicación entre sus ordenadores. Unos seis trenes se paran solos |
| 08:36 | Atocha ordena al AVE reanudar «con marcha normal». El maquinista lo pregunta y le dicen que sí |
| 08:48 | El Iryo avisa de que sigue parado y no puede rearmar el LZB. Nadie avisa al AVE |
| 08:53 | El AVE alcanza al Iryo en el km 118 |
| 22:17 | La jueza decreta secreto de sumario e incauta las cajas negras |

## 1. Clasificación

No se puede clasificar como ciberataque porque no hay pruebas. Dejamos dos opciones abiertas:

| | A: fallo técnico + error humano | B: ciberincidente |
|---|---|---|
| Origen | Avería del LZB, un equipo de 1992 | Alguien provoca la caída o manipula los sistemas |
| Situación | Es la línea que siguen las autoridades | Sin indicios públicos, no descartado |

**Clasificación provisional:** accidente ferroviario grave por fallo de un sistema antiguo, agravado por un error humano, con una posible causa informática sin comprobar.

**¿Equipos antiguos?** Sí. El LZB es de 1992. El Tribunal de Cuentas Europeo avisó en 2017 de que llegaba al final de su vida útil, Adif reconocía en 2020 que costaba encontrar repuestos y su sustitución (ERTMS, contratada en 2021) aún no funcionaba. El sindicato de maquinistas dice que fallaba a menudo los días anteriores.

**¿Ciberataque?** Hoy no hay nada que lo indique. Los bulos de «hackeo extranjero» se han desmentido. Pero hay dos razones para no cerrarlo sin mirar: en septiembre de 2026 hubo una intrusión en los sistemas de Adif y Renfe, y nadie ha analizado aún los ordenadores del LZB.

Un dato clave: aunque hubiera ataque, no explicaría el choque por sí solo. Al caer el LZB, los trenes se pararon, que es lo que debe pasar. El choque vino de la orden de las 08:36 y de que nadie parara al AVE a las 08:48. Un ataque solo explicaría el choque si hubiera hecho creer al centro de control que la vía estaba libre, y los audios dicen lo contrario.

**Para confirmarlo o descartarlo habría que revisar:** los logs de los ordenadores del LZB, el tráfico de red entre el LZB y el control, los accesos remotos de mantenimiento (y si tienen relación con la intrusión de septiembre), lo que veía el operador en pantalla y el estado de los cables de la zona.

## 2. Impacto

Muy grave, sea cual sea la causa.

- **Personas:** 74 fallecidos (cifra provisional, la Junta de CLM daba 69), unos 180 heridos y 15 críticos. Es el peor accidente ferroviario en España desde Angrois (2013).
- **Servicio:** alta velocidad Madrid–Andalucía cortada. No hay billetes a la venta hasta diciembre.
- **Infraestructura:** dos trenes y la vía del km 118 destruidos.
- **Confianza:** es el segundo accidente grave de alta velocidad del año, después de Adamuz, y circulan bulos de sabotaje.
- **Información:** se filtraron los audios del centro de control, que estaban bajo secreto de sumario, y hubo SMS falsos sobre las víctimas.

## 3. Prioridad

**Máxima.** Hay vidas en juego, un servicio esencial cortado y el mismo sistema funcionando en otros tramos. Además, las pruebas digitales del LZB se pierden si se reparan los equipos sin copiarlos antes.

## 4. Activos afectados

| Activo | Responsable | Afectación |
|---|---|---|
| Servicio de viajeros Madrid–Andalucía | Renfe, Iryo | Interrumpido |
| Centro de control de Atocha | Adif | Orden contraria a la norma |
| Central LZB del tramo Mora–Urda | Adif | Caída. Equipo de 1992 |
| Red y cables entre el LZB y el control | Adif | Donde se produjo el fallo de comunicación |
| Equipos LZB/ASFA de los trenes | Renfe, Iryo | El Iryo no pudo rearmar el LZB |
| Radio tren-tierra y sus grabaciones | Adif | Por ahí se dio la orden. Audios filtrados |
| Logs del LZB y accesos remotos | Adif | No consta que se hayan conservado |
| Cajas negras de los trenes | Renfe, Iryo | Incautadas por el juzgado |
| Vía y trenes | Adif, Renfe, Iryo | Destruidos |
| Personal y viajeros | — | Víctimas mortales y heridos |

## 5. Evidencias

| Evidencia | Estado | Custodia |
|---|---|---|
| Cajas negras de los dos trenes | Incautadas, sin analizar | Guardia Civil (juzgado de Orgaz) |
| Audios centro de control–maquinistas | Recogidos y filtrados a la prensa | CIAF / Adif |
| Registros del centro de control | Entregados a la CIAF y pedidos por la jueza | CIAF / juzgado |
| Logs de los ordenadores del LZB | **No consta que se conserven** | Sin asignar |
| Accesos remotos y tráfico de red | No consta | Adif |
| Escena del accidente | Reconstrucción 3D, perímetro de 2 km | Guardia Civil |
| Declaración del operador | Interrogado, no consta que esté investigado | Guardia Civil / CIAF |

Lo que más falta son los logs del LZB. Sin ellos, la hipótesis del ciberataque no se podrá cerrar nunca, ni en un sentido ni en otro.

## 6. Responsables

| Tarea | Quién |
|---|---|
| Emergencias y rescate | Junta de CLM, Guardia Civil, UME |
| Investigación judicial y pruebas | Juzgado de Orgaz y Guardia Civil |
| Investigación técnica | CIAF |
| Supervisión de la seguridad ferroviaria | AESF |
| Conservar y analizar el LZB | Adif, con la Guardia Civil y bajo control judicial |
| Comprobar si hubo ciberataque | Equipo de ciberseguridad de Adif, con CCN-CERT y CNPIC |
| Atención a víctimas | Renfe, Iryo, Adif, Cruz Roja |
| Comunicación y bulos | Ministerio de Transportes, Adif, Guardia Civil |

La comprobación del ciberataque es la única tarea que nadie ha asumido en público.

## 7. Seguimiento de las acciones iniciales

| Acción | Estado |
|---|---|
| Parada automática de los trenes al caer el LZB | Hecha |
| Plan de emergencias y despliegue de la UME | Hecha |
| Corte de la circulación Madrid–Andalucía | Hecha, sigue vigente |
| Secreto de sumario e incautación de las cajas negras | Hecha |
| Transporte alternativo por Ciudad Real | En curso |
| Interrogatorio del operador y recogida de audios | Hecha |
| Identificación de víctimas | En curso |
| **Copia forense de los ordenadores del LZB** | **Pendiente** |
| **Revisión de accesos remotos e intrusión de septiembre** | **Pendiente** |
| **Aviso al CCN-CERT / CNPIC o descarte por escrito** | **Pendiente** |
| Revisión de otros tramos con LZB | Pendiente |

La parte de emergencias y judicial está cubierta. La de ciberseguridad, no.

## Conclusión

Acertamos al apuntar a los equipos de los 90: el LZB estaba al final de su vida útil y fallaba a menudo. Pero lo que muestran los datos es una avería seguida de un error humano grave. La protección automática paró los trenes y lo que falló fue la decisión que vino después.

El ciberataque no se puede descartar porque nadie ha mirado los ordenadores del LZB. Lo primero sería copiarlos y analizarlos antes de repararlos, y así cerrar la duda con pruebas.

## Fuentes

- [elDiario.es: avería técnica y cadena de errores humanos](https://www.eldiario.es/castilla-la-mancha/averia-tecnica-cadena-errores-humanos-provocaron-fatal-accidente-urda_1_13621405.html)
- [Euronews: lo que aclaran los audios filtrados](https://es.euronews.com/2026/10/29/lo-que-aclaran-los-audios-filtrados-de-los-controladores-sobre-el-accidente-de-tren-de-urd)
- [Xataka: el LZB debería haber sido sustituido](https://www.xataka.com/movilidad/sistema-lzb-que-ha-fallado-accidente-toledo-deberia-haber-sido-sustituido-su-totalidad-ertms-2-2026/amp)
- [Libertad Digital: segundo día del accidente](https://www.libertaddigital.com/espana/2026-10-29/segundo-dia-accidente-tren-urda-toledo-ultima-hora-investigacion-7483738/)
- [Maldita.es: bulos sobre un ataque informático](https://maldita.es/desinfo/20261029/fuentes-de-inteligencia-no-descartan-un-posible-ataque-informatico-en-el-incidente-de-trenes-en-urda/)
- [El Demócrata: ciberataque a Adif en septiembre de 2026](https://www.democrata.es/economia/adif-sufre-ciberataque-sofisticado-con-posible-robo-informacion-acceso-proveedores/)
