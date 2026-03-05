# Política de Privacidad

**Protocolo Signet — Borrador v0.1.0**

*Plantilla — Consulte con un abogado cualificado en su jurisdicción antes de la implementación.*

**Fecha de Vigencia:** [FECHA]
**Última Actualización:** [FECHA]

---

## 1. Introducción

Esta Política de Privacidad describe cómo [ORGANIZATION NAME] ("nosotros," "nos" o "nuestro") recopila, utiliza, divulga y protege la información en relación con el Protocolo Signet (el "Protocolo"), un protocolo de verificación de identidad descentralizado para la red Nostr que utiliza pruebas de conocimiento cero, firmas de anillo y credenciales criptográficas.

El Protocolo Signet está diseñado con la privacidad como principio fundamental. Permite a los usuarios demostrar afirmaciones sobre su identidad — como rango de edad, estatus profesional o jurisdicción geográfica — sin revelar los datos personales subyacentes. Esta Política de Privacidad explica qué interacciones limitadas de datos ocurren y cómo se gestionan.

Esta Política se aplica a todos los usuarios, verificadores, partes que confían y otros participantes que interactúan con el Protocolo Signet, independientemente de su ubicación.

---

## 2. Responsable del Tratamiento de Datos

**Responsable del Tratamiento:** [ORGANIZATION NAME]
**Dirección Registrada:** [DIRECCIÓN]
**Correo Electrónico de Contacto:** [CONTACT EMAIL]
**Delegado de Protección de Datos (DPD):** [DPO EMAIL]

Para jurisdicciones que requieren un representante local:

- **Representante en la UE (Art. 27 del RGPD):** [NOMBRE Y DIRECCIÓN DEL REPRESENTANTE EN LA UE]
- **Representante en el Reino Unido (Art. 27 del RGPD del RU):** [NOMBRE Y DIRECCIÓN DEL REPRESENTANTE EN EL RU]
- **Brasil (LGPD):** [REPRESENTANTE EN BRASIL]
- **Corea del Sur (PIPA):** [REPRESENTANTE EN COREA DEL SUR]

---

## 3. Datos que Recopilamos y Procesamos

El Protocolo Signet está diseñado para minimizar la recopilación de datos. Debido a que el Protocolo utiliza pruebas de conocimiento cero, firmas de anillo y verificación de credenciales descentralizada, gran parte de la información permanece exclusivamente bajo el control del usuario y nunca se transmite ni es accesible para nosotros.

### 3.1 Categorías de Datos

| Categoría | Descripción | Fuente | Ubicación de Almacenamiento |
|-----------|-------------|--------|----------------------------|
| **Claves Públicas de Nostr** | Claves públicas secp256k1 (npub) utilizadas para interacciones del Protocolo | Generadas por el usuario | Relés de Nostr (descentralizado) |
| **Metadatos de Credenciales** | Tipos de eventos Nostr 30470–30475 que contienen nivel de verificación, marcas de tiempo de emisión, fechas de caducidad e identificadores de tipo de credencial | Generados durante la emisión de credenciales | Relés de Nostr (descentralizado) |
| **Pruebas de Conocimiento Cero** | Bulletproofs para verificación de rango de edad; futuras pruebas ZK-SNARK/ZK-STARK para otras afirmaciones | Generadas localmente por el usuario | Relés de Nostr (descentralizado) |
| **Firmas de Anillo** | Firmas criptográficas que demuestran la pertenencia a un grupo sin revelar qué miembro firmó | Generadas localmente por el usuario | Relés de Nostr (descentralizado) |
| **Datos del Nivel de Verificación** | Nivel (1–4) que indica la solidez de la verificación de identidad | Asignado durante la verificación | Integrado en eventos de credenciales |
| **Registros de Avales** | Eventos tipo 30471 que representan respaldos de la red de confianza | Creados por las partes que avalan | Relés de Nostr (descentralizado) |
| **Eventos de Política** | Eventos tipo 30472 que especifican requisitos de las partes que confían | Creados por las partes que confían | Relés de Nostr (descentralizado) |
| **Registro de Verificadores** | Eventos tipo 30473 que identifican a los verificadores profesionales | Creados por los verificadores | Relés de Nostr (descentralizado) |
| **Datos de Desafío/Respuesta** | Eventos tipo 30474 para desafíos de legitimidad de verificadores | Generados durante la verificación | Relés de Nostr (descentralizado) |
| **Registros de Revocación** | Eventos tipo 30475 para revocación de credenciales | Creados cuando se revocan credenciales | Relés de Nostr (descentralizado) |

### 3.2 Datos que NO Recopilamos

Por diseño, el Protocolo Signet **no** recopila, procesa ni almacena:

- Nombres reales, direcciones o números de identificación gubernamental
- Datos biométricos
- Fechas de nacimiento exactas (las pruebas de rango de edad solo revelan que un usuario se encuentra dentro de un rango)
- Información financiera o datos de pago
- Datos de ubicación o direcciones IP (a nivel de Protocolo; los operadores de relés pueden recopilar direcciones IP de forma independiente)
- Historial de navegación o huellas digitales del dispositivo
- Direcciones de correo electrónico (a menos que se proporcionen voluntariamente para soporte)
- Fotografías o imágenes
- Los datos subyacentes detrás de cualquier prueba de conocimiento cero

### 3.3 Datos Procesados por Terceros

Los operadores de relés de Nostr procesan de forma independiente los datos transmitidos a través de sus relés. Sus prácticas de datos se rigen por sus propias políticas de privacidad. El Protocolo Signet no controla a los operadores de relés.

---

## 4. Bases Legales para el Tratamiento

Procesamos datos bajo las siguientes bases legales, dependiendo de su jurisdicción:

### 4.1 Unión Europea / Espacio Económico Europeo (RGPD)

| Finalidad | Base Legal | Artículo del RGPD |
|-----------|------------|-------------------|
| Operación del Protocolo y verificación de credenciales | Interés legítimo | Art. 6(1)(f) |
| Cumplimiento de obligaciones legales | Obligación legal | Art. 6(1)(c) |
| Emisión de credenciales iniciada por el usuario | Ejecución de un contrato | Art. 6(1)(b) |
| Seguridad infantil y verificación de edad | Interés legítimo / Obligación legal | Art. 6(1)(f) / Art. 6(1)(c) |

### 4.2 Reino Unido (RGPD del RU / Ley de Protección de Datos 2018)

Se aplican las mismas bases legales que el RGPD de la UE, complementadas por la Ley de Protección de Datos 2018 y el Código de Diseño Apropiado para la Edad (AADC).

### 4.3 Estados Unidos (CCPA / CPRA / Leyes Estatales)

Bajo la Ley de Privacidad del Consumidor de California (CCPA) y la Ley de Derechos de Privacidad de California (CPRA):

- **No** vendemos información personal.
- **No** compartimos información personal para publicidad conductual entre contextos.
- Los residentes de California tienen derecho a saber, eliminar, corregir y optar por no participar.
- Cumplimos con las leyes de privacidad estatales aplicables, incluyendo las de Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah (UCPA) y otros estados con legislación de privacidad promulgada.

### 4.4 Brasil (LGPD — Lei Geral de Proteção de Dados)

El tratamiento se basa en:
- Interés legítimo (Art. 7, X)
- Cumplimiento de obligaciones legales o regulatorias (Art. 7, II)
- Ejecución de un contrato o procedimientos preliminares (Art. 7, V)

### 4.5 Corea del Sur (PIPA — Ley de Protección de Información Personal)

El tratamiento cumple con los requisitos de PIPA, incluyendo:
- Recopilación limitada al mínimo necesario
- Limitación de finalidad específica
- Notificación de las finalidades del tratamiento
- Cumplimiento de los requisitos de consentimiento

### 4.6 Japón (APPI — Ley de Protección de Información Personal)

El tratamiento cumple con la APPI enmendada, incluyendo:
- Especificación de la finalidad de utilización
- Adquisición adecuada de información personal
- Cumplimiento de los requisitos de transferencia transfronteriza

### 4.7 China (PIPL — Ley de Protección de Información Personal)

Cuando se accede al Protocolo desde la República Popular China:
- El tratamiento se basa en el consentimiento individual o la ejecución de un contrato
- Se respetan los requisitos de localización de datos
- Las transferencias transfronterizas cumplen con los Arts. 38–43 de la PIPL

### 4.8 India (DPDP — Ley de Protección de Datos Personales Digitales)

El tratamiento cumple con la Ley DPDP, incluyendo:
- Tratamiento basado en consentimiento o usos legítimos
- Obligaciones como fiduciario de datos
- Derechos de los titulares de datos

---

## 5. Cómo Utilizamos los Datos

Los datos procesados a través del Protocolo Signet se utilizan exclusivamente para:

1. **Emisión y Verificación de Credenciales** — Permitir a los usuarios crear, presentar y verificar credenciales en los cuatro niveles de verificación.
2. **Cálculo del Signet IQ** — Calcular el Signet IQ basado en avales de la red de confianza, niveles de credenciales e historial de verificación.
3. **Verificación de Rango de Edad** — Usar Bulletproofs para demostrar que un usuario se encuentra dentro de un rango de edad sin revelar su edad exacta.
4. **Verificación Profesional** — Permitir a profesionales con licencia (abogados, notarios, profesionales médicos) actuar como verificadores.
5. **Revocación de Credenciales** — Procesar eventos de revocación cuando las credenciales son invalidadas.
6. **Integridad del Protocolo** — Mantener la integridad criptográfica y la seguridad del Protocolo.
7. **Cumplimiento Legal** — Cumplir con las leyes y regulaciones aplicables.

---

## 6. Compartición y Divulgación de Datos

### 6.1 Compartición a Nivel de Protocolo

El Protocolo Signet opera en la red Nostr, que es descentralizada. Cuando publica un evento de credencial, aval u otro evento del Protocolo, este se transmite a los relés de Nostr. Esto es inherente al diseño del Protocolo y es iniciado por usted.

### 6.2 No Compartimos Datos Con

- Anunciantes o empresas de marketing
- Intermediarios de datos
- Plataformas de redes sociales (más allá de la publicación en relés de Nostr)
- Agencias gubernamentales (excepto cuando lo exija la ley o un proceso legal válido)

### 6.3 Divulgación Requerida por Ley

Podemos divulgar información si lo requiere:
- Una orden judicial válida, citación o proceso legal
- La ley o regulación aplicable
- Una solicitud de una autoridad policial o reguladora con jurisdicción válida

Notificaremos a los usuarios afectados de dichas solicitudes cuando sea legalmente permitido.

### 6.4 Compartición de Datos de Verificadores

Los verificadores profesionales (Nivel 3 y Nivel 4) publican eventos de registro de verificador (tipo 30473) en la red Nostr. Estos eventos incluyen la clave pública del verificador, credenciales profesionales e información jurisdiccional. Los verificadores consienten esta publicación como parte del Acuerdo de Verificador.

---

## 7. Transferencias Internacionales de Datos

### 7.1 Arquitectura Descentralizada

La red Nostr opera globalmente. Cuando publica eventos en relés de Nostr, esos eventos pueden ser replicados en relés ubicados en cualquier parte del mundo. Esta es una característica fundamental del protocolo descentralizado.

### 7.2 Mecanismos de Transferencia

Para cualquier procesamiento centralizado que realicemos, las transferencias internacionales de datos están protegidas por:

- **UE/EEE:** Cláusulas Contractuales Tipo (CCT) aprobadas por la Comisión Europea (Decisión 2021/914), complementadas con evaluaciones de impacto de la transferencia cuando sea necesario.
- **Reino Unido:** Acuerdo Internacional de Transferencia de Datos (IDTA) o Adenda del RU a las CCT de la UE.
- **Corea del Sur:** Cumplimiento de las disposiciones de transferencia transfronteriza de PIPA.
- **Japón:** Transferencias a países con un nivel adecuado de protección reconocido por la PPC, o con el consentimiento del usuario.
- **China:** Evaluaciones de seguridad, contratos estándar o certificaciones según lo requiera la PIPL.
- **Brasil:** Transferencias conformes con el Art. 33 de la LGPD, incluyendo a países con un nivel adecuado de protección o con garantías específicas.

### 7.3 Decisiones de Adecuación

Nos basamos en decisiones de adecuación cuando estén disponibles, incluyendo el Marco de Privacidad de Datos UE-EE.UU., la Extensión del RU al Marco de Privacidad de Datos UE-EE.UU. y la decisión de adecuación de Japón por la Comisión Europea.

---

## 8. Retención de Datos

### 8.1 Eventos de Nostr

Los eventos publicados en la red Nostr son retenidos por los operadores de relés según sus propias políticas. Debido a que la red Nostr es descentralizada, no podemos garantizar la eliminación de eventos de todos los relés.

### 8.2 Ciclo de Vida de las Credenciales

| Tipo de Datos | Período de Retención |
|---------------|---------------------|
| Credenciales activas | Hasta su caducidad o revocación |
| Credenciales revocadas | Los eventos de revocación se retienen indefinidamente para la integridad de la verificación |
| Credenciales caducadas | Retenidas en relés según las políticas del operador del relé |
| Registros de avales | Hasta que sean revocados por la parte que avala |
| Datos de desafío/respuesta | Efímeros; no se retienen después de que se completa la verificación |

### 8.3 Registros Centralizados

Los registros que mantenemos de forma centralizada (p. ej., correspondencia de soporte, registros de cumplimiento legal) se retienen durante:
- Registros de soporte: 2 años desde la última interacción
- Registros de cumplimiento legal: Según lo requiera la ley aplicable (típicamente 5–7 años)
- Registros de auditoría: 3 años

---

## 9. Sus Derechos

### 9.1 Derechos Universales

Independientemente de su jurisdicción, usted puede:
- Solicitar información sobre qué datos procesamos sobre usted
- Solicitar la corrección de datos inexactos
- Retirar el consentimiento cuando el tratamiento se base en el consentimiento
- Presentar una queja ante nosotros o ante una autoridad de control

### 9.2 Unión Europea / EEE (RGPD)

Bajo el RGPD, usted tiene derecho a:
- **Acceso** (Art. 15) — Obtener una copia de sus datos personales
- **Rectificación** (Art. 16) — Corregir datos inexactos
- **Supresión** (Art. 17) — Solicitar la eliminación ("derecho al olvido") cuando sea aplicable
- **Limitación** (Art. 18) — Limitar el tratamiento en determinadas circunstancias
- **Portabilidad de Datos** (Art. 20) — Recibir sus datos en un formato estructurado, de uso común y lectura mecánica
- **Oposición** (Art. 21) — Oponerse al tratamiento basado en interés legítimo
- **Decisiones Automatizadas** (Art. 22) — No ser objeto de decisiones exclusivamente automatizadas con efectos legales

**Autoridad de Control:** Puede presentar una queja ante su autoridad local de protección de datos.

### 9.3 Reino Unido (RGPD del RU)

Tiene derechos equivalentes a los del RGPD de la UE. Puede presentar una queja ante la Oficina del Comisionado de Información (ICO).

### 9.4 Estados Unidos (CCPA / CPRA)

Los residentes de California tienen derecho a:
- **Saber** — Qué información personal se recopila, utiliza y divulga
- **Eliminar** — Solicitar la eliminación de información personal
- **Corregir** — Solicitar la corrección de información personal inexacta
- **Optar por No Participar** — Optar por no participar en la venta o compartición de información personal (no vendemos ni compartimos)
- **No Discriminación** — No ser discriminado por ejercer derechos de privacidad

Para ejercer estos derechos, contacte a [CONTACT EMAIL] o envíe una solicitud a través de [URL DE DERECHOS DE PRIVACIDAD].

### 9.5 Brasil (LGPD)

Los titulares de datos tienen derecho a:
- Confirmación de la existencia del tratamiento
- Acceso a los datos
- Corrección de datos incompletos, inexactos o desactualizados
- Anonimización, bloqueo o eliminación de datos innecesarios o excesivos
- Portabilidad de datos
- Eliminación de datos tratados con consentimiento
- Información sobre datos compartidos
- Información sobre la posibilidad de denegar el consentimiento y sus consecuencias
- Revocación del consentimiento

### 9.6 Corea del Sur (PIPA)

Los titulares de datos tienen derecho a:
- Solicitar acceso a la información personal
- Solicitar corrección o eliminación
- Solicitar la suspensión del tratamiento
- Presentar una queja ante la PIPC

### 9.7 Japón (APPI)

Los titulares de datos tienen derecho a:
- Solicitar la divulgación de datos personales retenidos
- Solicitar corrección, adición o eliminación
- Solicitar el cese del uso o la provisión a terceros

### 9.8 China (PIPL)

Los titulares de datos tienen derecho a:
- Conocer y decidir sobre el tratamiento de información personal
- Restringir o rechazar el tratamiento
- Acceder y copiar información personal
- Solicitar portabilidad
- Solicitar corrección y eliminación
- Solicitar explicación de las reglas de tratamiento

### 9.9 India (Ley DPDP)

Los titulares de datos tienen derecho a:
- Acceder a información sobre el tratamiento
- Corrección y supresión de datos personales
- Reparación de agravios
- Nominar a otra persona para ejercer sus derechos

### 9.10 Ejercicio de Sus Derechos

Para ejercer cualquiera de los derechos anteriores, contáctenos en:
- **Correo Electrónico:** [CONTACT EMAIL]
- **Correo del DPD:** [DPO EMAIL]

Responderemos dentro de los plazos requeridos por la ley aplicable:
- RGPD/RGPD del RU: 30 días (ampliable 60 días para solicitudes complejas)
- CCPA/CPRA: 45 días (ampliable 45 días)
- LGPD: 15 días
- PIPA: 10 días
- APPI: Sin demora
- PIPL: Prontamente

---

## 10. Datos de Menores

### 10.1 Política General

El Protocolo Signet incluye el Nivel 4 (Verificación Profesional — Adulto + Menor), que está específicamente diseñado para la seguridad infantil. Nos tomamos extremadamente en serio la protección de los datos de los menores.

### 10.2 Verificación de Edad

El Protocolo utiliza pruebas de conocimiento cero basadas en Bulletproofs para la verificación del rango de edad. Estas pruebas demuestran que un usuario se encuentra dentro de un rango de edad determinado (p. ej., mayor de 13, mayor de 16, mayor de 18) sin revelar su fecha de nacimiento exacta.

### 10.3 Requisitos de Edad por Jurisdicción

| Jurisdicción | Edad Mínima para Consentimiento Digital | Ley Aplicable |
|-------------|----------------------------------------|---------------|
| UE (por defecto) | 16 años | Art. 8 del RGPD |
| UE (opción de estado miembro) | 13–16 años (varía) | Art. 8(1) del RGPD |
| Reino Unido | 13 años | RGPD del RU / AADC |
| Estados Unidos | 13 años | COPPA |
| Brasil | 12 años (con consentimiento parental hasta los 18) | Art. 14 de la LGPD |
| Corea del Sur | 14 años | PIPA |
| Japón | 15 años (directrices) | APPI |
| China | 14 años | Art. 28 de la PIPL |
| India | 18 años (con excepciones) | Ley DPDP |

### 10.4 Consentimiento Parental

Cuando se requiere consentimiento parental, el Protocolo admite:
- Consentimiento parental verificable a través de credenciales de padre/tutor verificadas en Nivel 3 o Nivel 4
- Restricción por edad a través de verificación de prueba ZK a nivel de la parte que confía
- Mecanismos para que los padres revisen, modifiquen o revoquen el consentimiento

### 10.5 Cumplimiento de COPPA (Estados Unidos)

Cumplimos con la Ley de Protección de la Privacidad de los Niños en Línea (COPPA). No recopilamos intencionalmente información personal de niños menores de 13 años sin consentimiento parental verificable.

### 10.6 Código de Diseño Apropiado para la Edad (Reino Unido)

Estamos comprometidos con los principios del Código de Diseño Apropiado para la Edad del RU (AADC), incluyendo:
- Evaluación del interés superior del niño
- Aplicación apropiada para la edad
- Minimización de datos
- Configuraciones predeterminadas protectoras para los menores
- Transparencia apropiada para la edad del niño

Para nuestra Política completa de Seguridad Infantil, consulte [ENLACE A LA POLÍTICA DE SEGURIDAD INFANTIL].

---

## 11. Seguridad

### 11.1 Seguridad Criptográfica

El Protocolo Signet emplea:
- **Firmas Schnorr** en la curva secp256k1 para toda la firma de credenciales
- **Bulletproofs** para pruebas de conocimiento cero de rango de edad
- **Firmas de anillo** para pruebas anónimas de pertenencia a un grupo
- **Futura capa ZK** planificada para tipos de pruebas adicionales (ZK-SNARKs/ZK-STARKs)

### 11.2 Seguridad Organizacional

Implementamos:
- Controles de acceso y principios de mínimo privilegio
- Cifrado en tránsito (TLS 1.2+) para cualquier servicio centralizado
- Evaluaciones de seguridad y pruebas de penetración regulares
- Procedimientos de respuesta a incidentes
- Formación del personal en protección de datos
- Prácticas de desarrollo seguro

### 11.3 Modelo de Seguridad Descentralizado

La arquitectura descentralizada del Protocolo proporciona beneficios de seguridad inherentes:
- Sin punto único de fallo
- Sin base de datos centralizada que vulnerar
- Gestión de claves controlada por el usuario
- Verificación criptográfica sin intermediarios de confianza

### 11.4 Notificación de Violaciones de Datos

En caso de una violación de datos personales que afecte a nuestros sistemas centralizados:
- Notificaremos a la autoridad de control pertinente dentro de las 72 horas (RGPD) o según lo requiera la ley aplicable
- Notificaremos a las personas afectadas sin demora indebida cuando la violación sea probable que resulte en un alto riesgo para sus derechos y libertades
- Documentaremos la violación, sus efectos y las acciones correctivas

---

## 12. Cookies y Tecnologías de Seguimiento

El Protocolo Signet **no** utiliza:
- Cookies
- Balizas web o píxeles de seguimiento
- Huellas digitales del navegador
- Almacenamiento local con fines de seguimiento
- Ningún servicio de análisis o seguimiento de terceros

Si los servicios auxiliares (como un sitio web de documentación) utilizan cookies, se proporcionará un aviso de cookies separado con los mecanismos de consentimiento apropiados.

---

## 13. Toma de Decisiones Automatizada y Elaboración de Perfiles

### 13.1 Cálculo del Signet IQ

El Protocolo calcula el Signet IQ basado en:
- Nivel de verificación (1–4)
- Número y calidad de los avales
- Credenciales y reputación del verificador
- Antigüedad e historial de las credenciales

El Signet IQ se calcula algorítmicamente y es visible para las partes que confían. No constituye toma de decisiones automatizada con efectos legales según el Art. 22 del RGPD, ya que es una entrada entre muchas que las partes que confían pueden considerar.

### 13.2 Sin Elaboración de Perfiles para Marketing

No participamos en la elaboración de perfiles para marketing, publicidad o análisis de comportamiento.

---

## 14. Enlaces y Servicios de Terceros

El Protocolo Signet puede interoperar con:
- Relés de Nostr (operados de forma independiente)
- Clientes de Nostr (como Fathom, la implementación de referencia)
- Organismos profesionales y registros regulatorios

Estos terceros tienen sus propias políticas de privacidad. No somos responsables de sus prácticas de datos.

---

## 15. Cambios a esta Política de Privacidad

Podemos actualizar esta Política de Privacidad de vez en cuando. Los cambios se indicarán actualizando la fecha de "Última Actualización" en la parte superior de este documento. Para cambios sustanciales, proporcionaremos aviso a través de:
- Un anuncio mediante evento de Nostr
- Una actualización del repositorio de especificaciones del Protocolo
- Notificación directa cuando sea factible

Su uso continuado del Protocolo después de los cambios constituye la aceptación de la Política de Privacidad actualizada.

---

## 16. Disposiciones Específicas por Jurisdicción

### 16.1 Unión Europea — Disposiciones Adicionales

Cuando procesamos datos personales bajo el RGPD, las disposiciones del RGPD prevalecen sobre cualquier disposición conflictiva en esta Política de Privacidad.

### 16.2 California — Disposiciones Adicionales

**No Vender ni Compartir Mi Información Personal:** No vendemos ni compartimos información personal según lo definido por la CCPA/CPRA.

**Incentivos Financieros:** No ofrecemos incentivos financieros relacionados con la recopilación de información personal.

**Shine the Light (Código Civil de California, Sección 1798.83):** Los residentes de California pueden solicitar información sobre divulgaciones de información personal a terceros para marketing directo. No realizamos tales divulgaciones.

### 16.3 Brasil — Disposiciones Adicionales

El DPD (Encarregado) puede ser contactado en [DPO EMAIL] para todas las consultas relacionadas con la LGPD.

### 16.4 Australia — Disposiciones Adicionales

Cumplimos con los Principios de Privacidad de Australia (APPs) bajo la Ley de Privacidad de 1988 (Cth). Puede presentar una queja ante la Oficina del Comisionado de Información de Australia (OAIC).

### 16.5 Nueva Zelanda — Disposiciones Adicionales

Cumplimos con la Ley de Privacidad de 2020 (NZ). Puede presentar una queja ante la Oficina del Comisionado de Privacidad.

### 16.6 Singapur — Disposiciones Adicionales

Cumplimos con la Ley de Protección de Datos Personales de 2012 (PDPA). Puede contactar a la Comisión de Protección de Datos Personales (PDPC) para quejas.

### 16.7 Sudáfrica — Disposiciones Adicionales

Cumplimos con la Ley de Protección de Información Personal de 2013 (POPIA). Puede presentar una queja ante el Regulador de Información.

---

## 17. Contáctenos

Para cualquier pregunta, inquietud o solicitud relacionada con esta Política de Privacidad o nuestras prácticas de datos:

**Consultas Generales:**
[ORGANIZATION NAME]
Correo Electrónico: [CONTACT EMAIL]

**Delegado de Protección de Datos:**
Correo Electrónico: [DPO EMAIL]

**Dirección Postal:**
[ORGANIZATION NAME]
[DIRECCIÓN]

---

## 18. Registros Regulatorios

Dependiendo de la jurisdicción, mantenemos registros o presentaciones ante:
- La Oficina del Comisionado de Información (RU) — Número de Registro: [NÚMERO DE REGISTRO ICO]
- Autoridades de protección de datos de la UE/EEE aplicables
- Otros organismos regulatorios según lo requiera la ley

---

*Esta Política de Privacidad se proporciona como plantilla para el Protocolo Signet. No constituye asesoramiento legal. [ORGANIZATION NAME] recomienda consultar con un abogado cualificado familiarizado con las leyes de protección de datos aplicables en su jurisdicción antes de la implementación.*

*Protocolo Signet — Borrador v0.1.0*
*Versión del Documento: 1.0*
