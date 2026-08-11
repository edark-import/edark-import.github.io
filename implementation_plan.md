# Sistema Modular de Pasarelas de Pago y Control de PayPal

Actualmente, el SDK de PayPal se intenta cargar e inicializar por defecto en el carrito de compras sin una opción para desactivarlo desde el panel de administración. Debido al cierre de tu cuenta de PayPal, es indispensable poder **activar o desactivar el cobro por PayPal** a voluntad, y dejar preparada una **arquitectura modular de pasarelas de pago** para integrar fácilmente alternativas locales o internacionales (como Culqi, Niubiz/Visa, Openpay, MercadoPago o Yape/Plin).

---

## Factibilidad Técnica de Integrar Otras Pasarelas

Es **100% factible** y muy directo de implementar en una aplicación web en JavaScript/HTML con Firebase como backend.

### Comparativa de Pasarelas sugeridas para Perú / LATAM:
1. **Culqi**: Muy fácil integración en JS frontend (JS SDK v4). Acepta Visa, Mastercard, AMEX, Yape y PagoEfectivo en PEN (Soles) y USD.
2. **Openpay (BBVA)**: JS SDK accesible para cobro directo con tarjetas de crédito/débito y pago en efectivo.
3. **Niubiz (Visa Perú)**: Requiere credenciales de comercio Niubiz y sesión backend para generación de tokens de pago.
4. **Mercado Pago**: Excelente documentación para checkout transparente o checkout pro con soporte de Tarjetas, Yape y PagoEfectivo.
5. **WhatsApp / Yape Directo**: Método directo sin comisiones donde el cliente envía captura de pago o coordina el pedido.

---

## User Review Required

> [!IMPORTANT]
> - **Control de PayPal**: Con el nuevo switch en el panel de administración, podrás desactivar PayPal inmediatamente. El botón de PayPal desaparecerá del carrito de compras de tus clientes sin romper el flujo de compras por WhatsApp.
> - **Estructura Extensible en Firestore**: Guardaremos en el documento `config/general` el estado de activación (`enabled`) y las llaves públicas (`publicKey` / `merchantId`) de cada pasarela activa.

---

## Proposed Changes

---

### Panel de Administración (`admin/dashboard.html`)

#### [MODIFY] [dashboard.html](file:///c:/Users/melvi/Documents/edark-web/edark-import.github.io/admin/dashboard.html)
- Añadir sección visual de **"Pasarelas y Métodos de Pago"** en la pestaña de Configuración.
- Añadir toggle switch: **Activar / Desactivar PayPal** (`cfgPaypalHabilitado`).
- Añadir bloques de configuración para pasarelas alternativas:
  - **PayPal**: Client ID + Switch Activo.
  - **Culqi**: Public Key + Switch Activo.
  - **Openpay**: Merchant ID + Public Key + Switch Activo.
  - **MercadoPago**: Public Key + Switch Activo.
  - **Niubiz / Visa**: Merchant Code + Switch Activo.
  - **Yape / Plin / WhatsApp**: Número de contacto / QR + Switch Activo.
- Actualizar `cargarConfiguracion()` para recuperar estos valores de Firestore `config/general`.
- Actualizar `guardarConfiguracion()` para persistir el mapa de estado de pasarelas.

---

### Frontend & Carrito (`js/scripts.js`)

#### [MODIFY] [scripts.js](file:///c:/Users/melvi/Documents/edark-web/edark-import.github.io/js/scripts.js)
- En `cargarPayPalDesdeConfig()`:
  - Verificar si `cfg.paypalHabilitado` es `true`.
  - Si está desactivado (`false`), no descargar el SDK de PayPal y marcar el estado como no disponible.
- En `initPayPalButton()` y `abrirCarritoOffcanvas()`:
  - Condicionar la renderización del contenedor `#paypal-button-container` al switch de configuración.
  - Renderizar dinámicamente las alternativas de pago activas en el carrito de compras (ej. Botón WhatsApp/Yape o botones de la pasarela activa).

---

## Verification Plan

### Manual Verification
1. **Desactivar PayPal desde Admin**:
   - Ir a `admin/dashboard.html#configuracion`.
   - Desmarcar "Habilitar pagos con PayPal" y guardar cambios.
   - Abrir la tienda (`index.html`), agregar un producto al carrito y abrir el carrito lateral.
   - Verificar que el contenedor/botón de PayPal NO aparece y que el cliente puede continuar vía WhatsApp.
2. **Re-activar PayPal desde Admin**:
   - Marcar el switch de PayPal nuevamente y guardar.
   - Verificar que en el carrito vuelve a aparecer el botón oficial de PayPal SDK.
3. **Persistencia de Configuración**:
   - Recargar la página de Admin y confirmar que las credenciales y toggles de pasarelas se mantienen guardados.
