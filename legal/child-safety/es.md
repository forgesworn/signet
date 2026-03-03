# Política de Seguridad Infantil

**Protocolo Signet — Borrador v0.1.0**

*Plantilla — Consulte con un abogado cualificado en su jurisdicción antes de la implementación.*

**Fecha de Vigencia:** [FECHA]
**Última Actualización:** [FECHA]

---

## 1. Propósito

Esta Política de Seguridad Infantil ("Política") establece el compromiso de [ORGANIZATION NAME] ("nosotros") con la protección de los menores que interactúan con o se ven afectados por el Protocolo Signet (el "Protocolo"). La verificación de Nivel 4 del Protocolo (Verificación Profesional — Adulto + Menor) aborda específicamente la verificación de identidad de menores, y esta Política rige cómo se maneja esa capacidad — y todos los datos relacionados con menores.

La seguridad y privacidad de los menores es nuestra máxima preocupación.

---

## 2. Ámbito de Aplicación

Esta Política se aplica a: todas las interacciones con el Protocolo que involucren a personas menores de 18 años (o la mayoría de edad en la jurisdicción correspondiente); la emisión y verificación de credenciales de Nivel 4; los procesos de verificación de edad mediante pruebas de conocimiento cero; todo el personal, verificadores, partes que confían y terceros que interactúan con datos de menores; y todas las jurisdicciones.

---

## 3. Verificación de Edad mediante Pruebas de Conocimiento Cero

El Protocolo utiliza Bulletproofs para la verificación de edad. Este enfoque: demuestra sin revelar (un usuario puede probar que está dentro de un rango de edad sin revelar su fecha de nacimiento exacta); no se puede realizar ingeniería inversa; se verifica criptográficamente; y se emite una vez pero se usa muchas veces.

### Rangos de edad estándar

| Rango | Descripción | Caso de Uso |
|-------|-------------|-------------|
| Menor de 13 | Por debajo del umbral COPPA | Requiere consentimiento parental completo |
| 13–15 | Por encima de COPPA, debajo de algunos umbrales RGPD | Puede requerir consentimiento parental |
| 16–17 | Por encima de la mayoría de las edades de consentimiento digital | Consentimiento independiente en la mayoría de jurisdicciones |
| 18+ | Mayoría de edad | Consentimiento independiente completo |

---

## 4. Mecanismos de Consentimiento Parental

| Jurisdicción | Edad de Consentimiento Digital | Mecanismo Requerido |
|-------------|-------------------------------|---------------------|
| Estados Unidos (COPPA) | 13 | Consentimiento parental verificable |
| UE (RGPD defecto) | 16 | Esfuerzos razonables de verificación |
| España | 14 | Según LOPDGDD |
| Reino Unido | 13 | Verificación apropiada para la edad |
| Brasil | 12 (con consentimiento hasta 18) | Consentimiento específico y prominente |
| Corea del Sur | 14 | Consentimiento del representante legal |
| India | 18 | Consentimiento verificable del padre/tutor |
| China | 14 | Consentimiento separado del padre/tutor |

El Protocolo admite: credencial verificada de padre/tutor de Nivel 3/4, co-verificación y consentimiento delegado. Los padres pueden retirar el consentimiento en cualquier momento publicando un evento de revocación (tipo 30475).

---

## 5. Minimización de Datos para Menores

Se aplican los principios más estrictos de minimización. Se recopila: clave pública Nostr del menor, prueba de rango de edad (ZK), registro de consentimiento parental y metadatos de credenciales. **No** se recopila: nombre, fecha de nacimiento, fotografía, número de identificación gubernamental, ubicación, escuela, datos de comportamiento ni seguimiento de uso.

Retención: credenciales activas hasta expiración, revocación o mayoría de edad; datos de verificación según obligaciones profesionales del verificador (1–3 años); datos de desafío/respuesta eliminados inmediatamente.

---

## 6. Usos Prohibidos

Están estrictamente prohibidos: la elaboración de perfiles de menores, el seguimiento, la publicidad dirigida, la monetización de datos, la toma de decisiones automatizada con efectos legales, la vigilancia, la puntuación social, las técnicas de manipulación (nudging), la recopilación innecesaria de datos y el intercambio sin consentimiento.

---

## 7. Notificación y Respuesta a Incidentes

| Tipo de Incidente | Prioridad |
|-------------------|-----------|
| Violación de datos de credenciales de menores | Crítica — Inmediata |
| Credencial de Nivel 4 fraudulenta | Crítica — Inmediata |
| Compromiso del mecanismo de consentimiento parental | Crítica — Inmediata |
| Explotación de la verificación de edad | Alta — 4 horas |
| Uso indebido por parte que confía | Alta — 4 horas |
| Sospecha de explotación infantil | Crítica — Inmediata + Fuerzas del orden |

---

## 8. Requisitos por Jurisdicción

### Reino Unido
Código de Diseño Apropiado para la Edad (AADC) — 15 estándares. Notificación al ICO en 72 horas.

### Estados Unidos
Cumplimiento de COPPA. Ley de Diseño Apropiado para la Edad de California. Notificación a la FTC.

### Unión Europea
RGPD Artículo 8 (13–16 años según estado miembro). España: 14 años. Notificación a la autoridad supervisora principal en 72 horas.

### Australia
Privacy Act 1988, Online Safety Act 2021. Notificación al OAIC y al eSafety Commissioner.

### Corea del Sur
PIPA + Ley de Protección Juvenil. Consentimiento del representante legal para menores de 14 años. Notificación a la PIPC.

### Brasil
LGPD Artículo 14 — interés superior del niño. Consentimiento parental específico para menores de 12 años. Notificación a la ANPD.

### India
Ley DPDP 2023. Consentimiento verificable del padre/tutor para todos los menores (menores de 18 años). Prohibición de seguimiento, monitoreo conductual y publicidad dirigida a menores.

---

## 9. Principios de Diseño

Privacidad por diseño: minimización de datos a nivel arquitectónico, pruebas de conocimiento cero, protecciones criptográficas, configuraciones predeterminadas protectoras. Seguridad por diseño: distinción clara entre flujos de trabajo de adultos y menores, salvaguardas contra el uso indebido, orientación apropiada para la edad.

---

## 10. Formación

Los verificadores de Nivel 4 deben completar formación en seguridad infantil antes de realizar verificaciones de menores y actualizarla anualmente. Todo el personal debe completar formación en concienciación sobre seguridad infantil.

---

## 11. Contacto

**Oficial de Seguridad Infantil:** [CONTACT EMAIL]
**Delegado de Protección de Datos:** [DPO EMAIL]
**Contacto General:** [ORGANIZATION NAME], [DIRECCIÓN]

**Reporte de emergencia:**
- RU: Internet Watch Foundation — [https://www.iwf.org.uk](https://www.iwf.org.uk)
- EE.UU.: NCMEC CyberTipline — [https://www.missingkids.org](https://www.missingkids.org)
- UE: INHOPE — [https://www.inhope.org](https://www.inhope.org)
- AU: eSafety Commissioner — [https://www.esafety.gov.au](https://www.esafety.gov.au)

---

*Esta Política de Seguridad Infantil se proporciona como plantilla para el Protocolo Signet. No constituye asesoramiento legal. [ORGANIZATION NAME] recomienda consultar con un abogado cualificado antes de la implementación.*

*Protocolo Signet — Borrador v0.1.0*
*Versión del Documento: 1.0*
