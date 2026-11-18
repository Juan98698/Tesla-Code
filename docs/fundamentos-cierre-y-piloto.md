# Evaluar la autonomía al cerrar Fundamentos con JavaScript

## Entrega final

En el reto de [reservas](../content/lessons/fundamentos/js-reto-de-reservas.json),
una persona adapta el planificador a un sistema de cupos. Antes de usar las
pistas, escribe el contrato, un caso que debería aprobar y uno que debería
rechazar. Conserva una versión anterior de la aplicación y anota lo que cambió.

El comprobador verifica retornos, límites, orden de los pedidos y conservación
de entradas. El módulo descargable de [pruebas de reservas](../assets/labs/plan/verificar-reservas.test.mjs)
permite repetir los casos en una copia local. La persona agrega casos suyos y
entrega el resultado de `node --test`, el enlace, el commit y la lista de
pruebas de navegador. El problema independiente de devoluciones cambia el
contrato a una operación completa o rechazada, con recuperación de datos.

### Criterios de revisión

Cada criterio se valora como **0** si falta evidencia, **1** si la evidencia
es parcial y **2** si la evidencia se puede reproducir. Registra el resultado
por criterio para que una entrega correcta en consola no oculte dificultades
de interfaz, razonamiento o recuperación.

| Criterio                | Evidencia para 2 puntos                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Entender y elegir       | Describe entradas, salidas y reglas. Compara las estructuras posibles y defiende por qué eligió la que usa.                                 |
| Implementar y conservar | Pasa los contratos de orden, agotamiento exacto, rechazo sin efectos y datos de entrada intactos.                                           |
| Comprobar con criterio  | Escribe un caso propio para la frontera y otro para descubrir un fallo plausible. Explica qué diferencia observó.                           |
| Depurar y recuperar     | Presenta entrada, síntoma, hipótesis, caso que falla antes, referencia del cambio y caso que pasa después. Prueba recarga y copia inválida. |
| Usar por teclado        | Otra persona reserva, lee el resultado y se recupera de un error usando Tab y Enter. Prueba foco visible en una vista estrecha.             |
| Reproducir la entrega   | Otra persona abre la URL indicada o clona el commit, sigue el README y obtiene el mismo resultado y las mismas pruebas.                     |

Además de clasificar las devoluciones como aplicadas o inválidas, revisa que
la persona pueda explicar por qué una devolución válida seguida de otra
inválida conserva todo el inventario original. El entorno automático
contrasta la función. El criterio por escrito y los pasos de navegador se
revisan con la entrega real.

## Prueba con personas que empiezan desde cero

1. Antes de empezar, registra qué conocimientos trae cada participante. Pídele
   leer un pequeño programa, predecir un resultado y explicar cómo lo
   comprobaría. Usa esa entrada para interpretar avances y dificultades.
2. Durante la ruta toma notas en los primeros ejercicios de terminal, decisiones,
   coste, eventos y proyecto. Registra minutos hasta el primer paso correcto,
   intentos, pistas consultadas y qué parte tuvo que explicar otra persona.
3. Al terminar, revisa la entrega con la tabla anterior. Durante esta tarea
   registra por separado lo que la persona resolvió por sí misma y la ayuda
   que recibió. En una revisión docente contrasta si cada punto acredita
   la habilidad anunciada.
4. Entre dos y tres semanas después, presenta el problema de abajo sin mostrar
   una solución. Permite la documentación oficial y solicita una predicción,
   código, casos propios y una explicación breve de estrategia.
5. Compara los criterios de ambas entregas. Si una dificultad aparece en más de
   una persona, revisa el ejemplo, la graduación de pistas o el requisito
   anterior y vuelve a comprobar el cambio con un caso diferente.

### Problema posterior

Un centro cultural recibe préstamos de materiales. Cada solicitud tiene un
código y una cantidad. Los códigos se comparan respetando mayúsculas. Las
solicitudes que superan la cantidad disponible se rechazan y la siguiente
solicitud sigue viendo el mismo estado. Una devolución con código inexistente
o cantidad inválida tampoco debe alterar las existencias. Prepara un informe
con las solicitudes aceptadas, las rechazadas y las existencias finales.

Entrega una función que procese las operaciones en orden y explica cómo
verificas que la entrada se conserva. Crea pruebas para un agotamiento exacto,
un rechazo seguido de una operación correcta y un catálogo vacío. Compara
dos estrategias para localizar materiales cuando el catálogo y el número de
pedidos crecen. Registra la evidencia con los criterios anteriores.

El piloto se considera pendiente hasta hacer las sesiones. Las pruebas
automáticas del repositorio sirven para detectar regresiones del curso y de
su comprobador.
