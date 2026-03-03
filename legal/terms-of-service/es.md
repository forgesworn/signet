# Términos de Servicio

**Protocolo Signet — Borrador v0.1.0**

*Plantilla — Consulte con un abogado cualificado en su jurisdicción antes de la implementación.*

**Fecha de Vigencia:** [FECHA]
**Última Actualización:** [FECHA]

---

## 1. Aceptación de los Términos

Al acceder, utilizar o participar en el Protocolo Signet (el "Protocolo"), incluyendo, entre otros, la creación de credenciales, la emisión o recepción de avales, la actuación como verificador o la confianza en las credenciales del Protocolo, usted ("Usuario," "usted" o "su") acepta quedar vinculado por estos Términos de Servicio ("Términos"). Si no está de acuerdo con estos Términos, no debe utilizar el Protocolo.

Estos Términos constituyen un acuerdo legalmente vinculante entre usted y [ORGANIZATION NAME] ("nosotros," "nos" o "nuestro").

Si utiliza el Protocolo en nombre de una organización, declara y garantiza que tiene la autoridad para vincular a dicha organización a estos Términos, y "usted" se refiere tanto a usted individualmente como a la organización.

---

## 2. Elegibilidad

### 2.1 Elegibilidad General

Para utilizar el Protocolo, debe:
- Tener al menos la edad de consentimiento digital en su jurisdicción (ver Sección 2.2)
- Tener capacidad legal para celebrar un acuerdo vinculante
- No tener prohibido el uso del Protocolo bajo ninguna ley o regulación aplicable
- No haber sido previamente suspendido o eliminado del Protocolo por violación de estos Términos

### 2.2 Requisitos de Edad

| Jurisdicción | Edad Mínima | Con Consentimiento Parental |
|-------------|-------------|----------------------------|
| Unión Europea (por defecto) | 16 | 13 (varía por estado miembro) |
| Reino Unido | 13 | N/A |
| Estados Unidos | 13 | Menores de 13 con consentimiento parental conforme a COPPA |
| Brasil | 18 | 12 con consentimiento parental |
| Corea del Sur | 14 | Menores de 14 con consentimiento parental |
| Japón | 15 | Menores de 15 con consentimiento parental |
| China | 14 | Menores de 14 con consentimiento parental |
| India | 18 | Según la Ley DPDP |
| Otros | Mayoría de edad o edad de consentimiento digital | Según la ley local |

### 2.3 Elegibilidad de Verificadores

Para actuar como verificador profesional (Nivel 3 o Nivel 4), debe adicionalmente:
- Poseer una licencia profesional vigente y válida en buen estado (p. ej., legal, médica, notarial)
- Estar autorizado para ejercer en la jurisdicción relevante
- Firmar el Acuerdo de Verificador separado
- Mantener un seguro de responsabilidad profesional según lo especificado en el Acuerdo de Verificador

---

## 3. Descripción del Protocolo

### 3.1 Resumen

El Protocolo Signet es un protocolo de verificación de identidad descentralizado para la red Nostr. Permite a los usuarios crear y verificar credenciales de identidad utilizando pruebas de conocimiento cero, firmas de anillo y un sistema de confianza escalonado, sin revelar datos personales subyacentes.

### 3.2 Niveles de Verificación

El Protocolo implementa cuatro niveles de verificación:

- **Nivel 1 — Auto-declarado:** Credenciales generadas por el usuario sin verificación externa. Nivel de confianza más bajo.
- **Nivel 2 — Red de Confianza:** Credenciales fortalecidas por avales de otros participantes del Protocolo. Confianza derivada de respaldos de la red.
- **Nivel 3 — Verificación Profesional (Adulto):** Credenciales verificadas por un verificador profesional con licencia a través de un proceso de verificación presencial o equivalente.
- **Nivel 4 — Verificación Profesional (Adulto + Menor):** Verificación de Nivel 3 extendida para incluir la verificación de identidad de menores con la supervisión adecuada del padre/tutor.

### 3.3 Tipos de Eventos

El Protocolo utiliza los siguientes tipos de eventos de Nostr (los números son provisionales pendientes de asignación NIP):
- **30470** — Eventos de credenciales
- **30471** — Eventos de avales
- **30472** — Eventos de políticas
- **30473** — Eventos de registro de verificadores
- **30474** — Eventos de desafío
- **30475** — Eventos de revocación

### 3.4 Componentes Criptográficos

El Protocolo utiliza:
- Firmas Schnorr en la curva secp256k1
- Bulletproofs para pruebas de conocimiento cero de rango de edad
- Firmas de anillo para pruebas anónimas de pertenencia a un grupo
- Capa ZK futura planificada (ZK-SNARKs/ZK-STARKs)

### 3.5 Naturaleza Descentralizada

El Protocolo opera en la red Nostr y no tiene servidor central, base de datos ni autoridad. [ORGANIZATION NAME] desarrolla y mantiene la especificación del Protocolo pero no controla la red, los operadores de relés ni los participantes individuales.

---

## 4. Obligaciones del Usuario

### 4.1 Obligaciones Generales

Todos los usuarios del Protocolo deben:

1. **Exactitud:** Proporcionar información veraz al crear credenciales. Las credenciales fraudulentas socavan el modelo de confianza y pueden constituir fraude penal.
2. **Seguridad de Claves:** Salvaguardar su clave privada de Nostr (nsec). Usted es el único responsable de la seguridad de su clave privada. Las claves perdidas o comprometidas no pueden ser recuperadas por nosotros.
3. **Cumplimiento:** Cumplir con todas las leyes y regulaciones aplicables en su jurisdicción.
4. **Uso Responsable:** Utilizar el Protocolo de buena fe y no para ningún propósito ilegal, fraudulento o dañino.
5. **Notificación:** Informar rápidamente sobre cualquier vulnerabilidad de seguridad, fraude de credenciales o uso indebido del Protocolo a [CONTACT EMAIL].

### 4.2 Usos Prohibidos

Usted NO debe:

1. Crear credenciales falsas, engañosas o fraudulentas
2. Suplantar a otra persona o entidad
3. Intentar realizar ingeniería inversa de las pruebas de conocimiento cero para extraer datos subyacentes
4. Usar el Protocolo para facilitar actividades ilegales, incluyendo, entre otros, robo de identidad, fraude, lavado de dinero o financiación del terrorismo
5. Atacar la infraestructura criptográfica del Protocolo, incluyendo intentar romper los conjuntos de anonimato de las firmas de anillo
6. Enviar spam a la red con eventos de credenciales o avales ilegítimos
7. Confabularse con verificadores para emitir credenciales de Nivel 3 o Nivel 4 injustificadas
8. Explotar el Protocolo para eludir restricciones de edad o medidas de seguridad infantil
9. Usar sistemas automatizados para generar masivamente credenciales o avales sin verificación genuina
10. Interferir o interrumpir la operación del Protocolo o la red Nostr

### 4.3 Obligaciones de Avales (Nivel 2)

Al avalar a otro usuario:
- Debe tener una base genuina para el aval
- No debe aceptar pago u otra contraprestación por proporcionar avales (esquemas de pago por aval)
- Puede revocar un aval en cualquier momento publicando un evento de revocación
- Comprende que su comportamiento de aval afecta su propia puntuación de confianza

---

## 5. Obligaciones del Verificador

### 5.1 Estándares Profesionales

Los verificadores deben:
1. Poseer y mantener credenciales profesionales válidas en su jurisdicción
2. Realizar verificaciones de acuerdo con el Acuerdo de Verificador y las normas profesionales aplicables
3. Verificar la identidad en persona o mediante un proceso legalmente equivalente
4. Mantener registros precisos de las verificaciones según sus obligaciones profesionales
5. Informar de cualquier compromiso en sus credenciales o procesos de verificación de inmediato

### 5.2 Responsabilidad del Verificador

Los verificadores son independientemente responsables de la exactitud e integridad de sus verificaciones. [ORGANIZATION NAME] no supervisa, respalda ni garantiza la calidad del trabajo de ningún verificador individual.

### 5.3 Terminación del Verificador

El estatus de verificador puede ser revocado si:
- La licencia profesional del verificador es suspendida o revocada
- Se descubre que el verificador ha emitido verificaciones fraudulentas
- El verificador incumple el Acuerdo de Verificador
- El verificador no mantiene el seguro requerido

---

## 6. Emisión y Ciclo de Vida de Credenciales

### 6.1 Creación de Credenciales

Las credenciales se crean publicando eventos tipo 30470 en la red Nostr. El nivel de confianza de la credencial corresponde a su nivel de verificación.

### 6.2 Validez de las Credenciales

Las credenciales pueden incluir una fecha de caducidad. Las partes que confían deben verificar:
- Que la credencial no haya sido revocada (tipo 30475)
- Que la credencial no haya caducado
- Que el nivel de verificación de la credencial cumple sus requisitos (política tipo 30472)
- Que la puntuación de confianza de la credencial sea aceptable

### 6.3 Revocación de Credenciales

Las credenciales pueden ser revocadas por:
- El titular de la credencial (auto-revocación)
- El verificador emisor (por causa, como fraude descubierto)
- El Protocolo (en casos de fraude sistémico o compromiso de seguridad, mediante consenso comunitario)

La revocación se realiza publicando un evento tipo 30475.

### 6.4 Sin Garantía de Aceptación

[ORGANIZATION NAME] no garantiza que ninguna credencial será aceptada por ninguna parte que confía. Las partes que confían establecen sus propias políticas de aceptación mediante eventos tipo 30472.

---

## 7. Propiedad Intelectual

### 7.1 Especificación del Protocolo

La especificación del Protocolo Signet se publica bajo una licencia de código abierto según lo especificado en el repositorio del Protocolo. Se le otorga una licencia para usar, implementar y desarrollar sobre el Protocolo de acuerdo con dicha licencia.

### 7.2 Marcas Comerciales

"Protocolo Signet" y los logotipos asociados son marcas comerciales de [ORGANIZATION NAME]. No puede usar estas marcas de manera que implique respaldo o afiliación sin consentimiento previo por escrito, excepto para referencia descriptiva precisa del Protocolo.

### 7.3 Contenido del Usuario

Usted retiene la propiedad de cualquier contenido que cree utilizando el Protocolo. Al publicar eventos en la red Nostr, reconoce que estos eventos son públicamente visibles y pueden ser almacenados y replicados por los operadores de relés.

### 7.4 Contribuciones

Las contribuciones a la especificación o código de implementación del Protocolo están sujetas al acuerdo de licencia de contribuyente especificado en el repositorio del Protocolo.

---

## 8. Descargos de Responsabilidad

### 8.1 Protocolo Proporcionado "Tal Cual"

EL PROTOCOLO SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD" SIN GARANTÍAS DE NINGÚN TIPO, YA SEAN EXPRESAS O IMPLÍCITAS, INCLUYENDO, ENTRE OTRAS, LAS GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO PARTICULAR, TÍTULO Y NO INFRACCIÓN.

### 8.2 Sin Garantía de Exactitud

[ORGANIZATION NAME] NO GARANTIZA QUE:
- CUALQUIER CREDENCIAL SEA EXACTA, COMPLETA O FIABLE
- CUALQUIER VERIFICADOR SEA COMPETENTE, HONESTO O DEBIDAMENTE LICENCIADO
- EL PROTOCOLO OPERARÁ SIN INTERRUPCIÓN O ERROR
- LOS COMPONENTES CRIPTOGRÁFICOS PERMANECERÁN SEGUROS INDEFINIDAMENTE
- EL PROTOCOLO CUMPLIRÁ CON SUS REQUISITOS ESPECÍFICOS
- CUALQUIER PUNTUACIÓN DE CONFIANZA REFLEJE CON EXACTITUD LA FIABILIDAD DE UN USUARIO

### 8.3 Descargo de Responsabilidad por Descentralización

Debido a que el Protocolo opera en una red descentralizada, [ORGANIZATION NAME]:
- No puede controlar, monitorear o censurar la actividad del Protocolo
- No puede revertir o modificar eventos publicados
- No puede garantizar la disponibilidad o rendimiento de ningún relé
- No puede hacer cumplir estos Términos contra todos los participantes a nivel global

### 8.4 Descargo de Responsabilidad Criptográfico

Aunque el Protocolo utiliza técnicas criptográficas de última generación, ningún sistema criptográfico es demostrablemente seguro contra todos los ataques futuros. Los avances en computación (incluida la computación cuántica) pueden afectar la seguridad de los componentes criptográficos del Protocolo.

### 8.5 Descargo de Responsabilidad Regulatorio

El panorama regulatorio para la identidad descentralizada y las pruebas de conocimiento cero está en evolución. Las obligaciones de cumplimiento pueden cambiar, y las características del Protocolo pueden estar sujetas a nuevas regulaciones.

---

## 9. Limitación de Responsabilidad

### 9.1 Limitación General

EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE, [ORGANIZATION NAME], SUS DIRECTORES, OFICIALES, EMPLEADOS, AGENTES Y AFILIADOS NO SERÁN RESPONSABLES POR NINGÚN DAÑO INDIRECTO, INCIDENTAL, ESPECIAL, CONSECUENTE, PUNITIVO O EJEMPLAR, INCLUYENDO, ENTRE OTROS, DAÑOS POR PÉRDIDA DE BENEFICIOS, FONDO DE COMERCIO, USO, DATOS U OTRAS PÉRDIDAS INTANGIBLES.

### 9.2 Límite de Responsabilidad

EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE, LA RESPONSABILIDAD TOTAL ACUMULADA DE [ORGANIZATION NAME] POR TODAS LAS RECLAMACIONES NO EXCEDERÁ EL MAYOR DE: (A) LA CANTIDAD QUE USTED PAGÓ A [ORGANIZATION NAME] EN LOS 12 MESES ANTERIORES A LA RECLAMACIÓN, O (B) [CANTIDAD LÍMITE DE RESPONSABILIDAD].

### 9.3 Excepciones

Las limitaciones en las Secciones 9.1 y 9.2 no se aplican a:
- Responsabilidad que no puede ser excluida o limitada bajo la ley aplicable
- Responsabilidad derivada de dolo o negligencia grave
- Responsabilidad por muerte o lesiones personales causadas por negligencia (en jurisdicciones donde dicha limitación está prohibida)

### 9.4 Protección del Consumidor

Nada en estos Términos afecta sus derechos legales como consumidor bajo las leyes de protección al consumidor aplicables que no pueden ser renunciados o limitados por contrato.

---

## 10. Indemnización

### 10.1 Sus Obligaciones de Indemnización

Usted acepta indemnizar, defender y mantener indemne a [ORGANIZATION NAME], sus directores, oficiales, empleados, agentes y afiliados de y contra todas las reclamaciones, daños, pérdidas, responsabilidades, costos y gastos (incluyendo honorarios razonables de abogados) que surjan de:

1. Su uso del Protocolo
2. Su incumplimiento de estos Términos
3. Su violación de cualquier ley o regulación aplicable
4. Su infracción de derechos de terceros
5. Credenciales que cree, incluyendo credenciales falsas o engañosas
6. Avales que emita
7. Verificaciones que realice (si es verificador)

---

## 11. Ley Aplicable y Resolución de Disputas

### 11.1 Ley Aplicable

Estos Términos se rigen e interpretan de acuerdo con las leyes de [JURISDICCIÓN DE LEY APLICABLE], sin tener en cuenta sus disposiciones sobre conflicto de leyes.

### 11.2 Resolución de Disputas

Cualquier disputa, controversia o reclamación que surja de o se relacione con estos Términos o el Protocolo se resolverá de la siguiente manera:

**Paso 1 — Negociación:** Las partes intentarán primero resolver la disputa mediante negociación de buena fe durante un período de 30 días.

**Paso 2 — Mediación:** Si la negociación falla, las partes someterán la disputa a mediación administrada por [ORGANISMO DE MEDIACIÓN].

**Paso 3 — Arbitraje:** Si la mediación falla, la disputa se resolverá definitivamente mediante arbitraje vinculante administrado por [ORGANISMO DE ARBITRAJE]. El arbitraje se llevará a cabo en [SEDE DEL ARBITRAJE].

### 11.3 Renuncia a Acciones Colectivas

EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE, USTED ACEPTA QUE CUALQUIER PROCEDIMIENTO DE RESOLUCIÓN DE DISPUTAS SE LLEVARÁ A CABO SOLO DE FORMA INDIVIDUAL Y NO EN UNA ACCIÓN COLECTIVA, CONSOLIDADA O REPRESENTATIVA.

### 11.4 Excepciones

No obstante lo anterior, cualquiera de las partes puede buscar medidas cautelares u otros remedios de equidad ante cualquier tribunal con jurisdicción competente.

### 11.5 Derechos del Consumidor de la UE

Si usted es un consumidor en la Unión Europea, también puede presentar una queja a través de la plataforma de Resolución de Disputas en Línea de la UE en [https://ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr).

---

## 12. Terminación

### 12.1 Su Derecho a Terminar

Puede dejar de utilizar el Protocolo en cualquier momento. Debido a la naturaleza descentralizada del Protocolo, los eventos publicados previamente pueden permanecer en los relés de Nostr.

### 12.2 Nuestro Derecho a Terminar

Nos reservamos el derecho de:
- Revocar credenciales de verificador por causa justificada
- Publicar avisos comunitarios sobre credenciales o actores fraudulentos
- Modificar o discontinuar la especificación del Protocolo

### 12.3 Efecto de la Terminación

Tras la terminación:
- Cesa su derecho a utilizar cualquier componente propietario del Protocolo
- Las Secciones 7, 8, 9, 10, 11 y 14 sobreviven a la terminación
- Los eventos de Nostr publicados previamente no se ven afectados

---

## 13. Modificaciones

### 13.1 Derecho a Modificar

Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones serán efectivas tras:
- La publicación de los Términos actualizados en el repositorio del Protocolo
- Un anuncio mediante evento de Nostr referenciando los Términos actualizados
- 30 días de aviso para cambios sustanciales

### 13.2 Aceptación de las Modificaciones

Su uso continuado del Protocolo después de la fecha efectiva de cualquier modificación constituye la aceptación de los Términos modificados.

### 13.3 Cambios Sustanciales

Para cambios sustanciales que afecten significativamente sus derechos u obligaciones, proporcionaremos:
- Aviso claro de los cambios
- Un resumen de los cambios clave
- Un período razonable (al menos 30 días) antes de que los cambios entren en vigor

---

## 14. Disposiciones Generales

### 14.1 Acuerdo Completo

Estos Términos, junto con la Política de Privacidad, cualquier Acuerdo de Verificador aplicable y cualquier Acuerdo de Procesamiento de Datos, constituyen el acuerdo completo entre usted y [ORGANIZATION NAME] respecto al Protocolo.

### 14.2 Divisibilidad

Si cualquier disposición de estos Términos se considera inválida o inaplicable, dicha disposición se aplicará en la máxima medida permisible, y las disposiciones restantes permanecerán en plena vigencia y efecto.

### 14.3 Renuncia

El incumplimiento de [ORGANIZATION NAME] en hacer cumplir cualquier disposición de estos Términos no constituirá una renuncia a dicha disposición ni a cualquier otra disposición.

### 14.4 Cesión

No puede ceder ni transferir estos Términos sin nuestro consentimiento previo por escrito. Nosotros podemos ceder estos Términos sin su consentimiento.

### 14.5 Fuerza Mayor

Ninguna de las partes será responsable por cualquier incumplimiento o retraso debido a causas fuera de su control razonable, incluyendo, entre otros, desastres naturales, guerras, terrorismo, pandemias, acciones gubernamentales, fallos de red o compromisos de algoritmos criptográficos.

### 14.6 Notificaciones

Las notificaciones a [ORGANIZATION NAME] deben enviarse a [CONTACT EMAIL].

### 14.7 Terceros Beneficiarios

Estos Términos no crean ningún derecho de terceros beneficiarios excepto según lo expresamente establecido en este documento.

### 14.8 Cumplimiento de Exportación

Usted acepta cumplir con todas las leyes y regulaciones de exportación y sanciones aplicables. Los componentes criptográficos del Protocolo pueden estar sujetos a controles de exportación en ciertas jurisdicciones.

---

## 15. Contacto

Para preguntas sobre estos Términos:

**[ORGANIZATION NAME]**
Correo Electrónico: [CONTACT EMAIL]
Dirección: [DIRECCIÓN]

---

*Estos Términos de Servicio se proporcionan como plantilla para el Protocolo Signet. No constituyen asesoramiento legal. [ORGANIZATION NAME] recomienda consultar con un abogado cualificado familiarizado con las leyes aplicables en su jurisdicción antes de la implementación.*

*Protocolo Signet — Borrador v0.1.0*
*Versión del Documento: 1.0*
