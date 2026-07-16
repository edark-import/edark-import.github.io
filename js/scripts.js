// --- CONFIGURACIÓN FIREBASE Y LÓGICA PRINCIPAL (SOLO UNA VEZ) ---
// La configuración de Firebase está en js/firebase-config.js
// Variables disponibles: db, auth, analytics

// --- SEGURIDAD Y VALIDACIONES ---
function sanitize(str) {
    return String(str).replace(/[<>&"'`]/g, c => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
    })[c]);
}
function safeImageUrl(url) {
    try {
        const u = new URL(url, window.location.origin);
        if (u.protocol === "http:" || u.protocol === "https:") return url;
    } catch { }
    return 'https://dummyimage.com/450x300/dee2e6/6c757d.jpg';
}
// Forzar HTTPS solo si se accede por HTTP en un servidor remoto (no en file:// ni localhost)
if (location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    location.href = 'https://' + location.hostname + location.pathname + location.search;
}
// Protección clickjacking
if (window.top !== window.self) window.top.location = window.self.location;

// --- VARIABLES GLOBALES ---
var db = window.db || (typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore() : null);
var auth = window.auth || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);
var storage = window.storage || (typeof firebase !== 'undefined' && firebase.storage ? firebase.storage() : null);
var carrito = window.carrito || JSON.parse(localStorage.getItem('carrito')) || [];

var tipoCambioGlobal = window.tipoCambioGlobal || 3.8; // Tipo de cambio SUNAT global
var configGeneral = window.configGeneral || null;   // Configuración global desde Firestore
// Número de WhatsApp para pedidos. Cambia aquí tu número en formato internacional, sin espacios ni signos.
var phone = window.phone || '51916907657'; // <-- Cambia este número por el tuyo
var productosCache = window.productosCache || [];
var paginaActual = window.paginaActual || 1;
var productosPorPagina = window.productosPorPagina || 12;
var unsubscribe = window.unsubscribe || null;
var textoBusqueda = window.textoBusqueda || '';

// --- OBTENER Y MOSTRAR TIPO DE CAMBIO SUNAT O MANUAL ---
async function inicializarTipoCambioSunat() {
    if (!configGeneral && typeof db !== 'undefined') {
        try {
            const snap = await db.collection('config').doc('general').get();
            if (snap.exists) configGeneral = snap.data();
        } catch (e) { console.warn('Error al precargar configGeneral para TC:', e); }
    }

    if (configGeneral && configGeneral.usarTcManual && configGeneral.tipoCambioManual) {
        tipoCambioGlobal = parseFloat(configGeneral.tipoCambioManual) || 3.8;
        const v = document.getElementById('tipoCambioValor');
        const m = document.getElementById('tipoCambioMoneda');
        const f = document.getElementById('tipoCambioFecha');
        const o = document.getElementById('tipoCambioOrigen');
        if (v) v.textContent = tipoCambioGlobal.toFixed(3);
        if (m) m.textContent = 'USD/PEN';
        if (f) f.textContent = '(Fijo / Manual)';
        if (o) o.textContent = '- Tienda';
        const tcText = document.getElementById('tipoCambioText');
        if (tcText) tcText.textContent = `S/ ${tipoCambioGlobal.toFixed(2)}`;
        return;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        let res = await fetch('https://corsproxy.io/?https://api.apis.net.pe/v1/tipo-cambio-sunat', { signal: controller.signal }).catch(() => null);
        if (!res || !res.ok) {
            res = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.apis.net.pe/v1/tipo-cambio-sunat'), { signal: controller.signal });
        }
        clearTimeout(timeoutId);
        if (res && res.ok) {
            const data = await res.json();
            if (data && (data.venta || data.compra)) {
                tipoCambioGlobal = parseFloat(data.venta || data.compra);
                const v = document.getElementById('tipoCambioValor');
                const m = document.getElementById('tipoCambioMoneda');
                const f = document.getElementById('tipoCambioFecha');
                const o = document.getElementById('tipoCambioOrigen');
                if (v) v.textContent = tipoCambioGlobal.toFixed(3);
                if (m) m.textContent = `${data.moneda ? data.moneda : 'USD/PEN'}`;
                if (f) f.textContent = data.fecha ? `(${data.fecha})` : '';
                if (o) o.textContent = data.origen ? `- ${data.origen}` : '';
                const tcText = document.getElementById('tipoCambioText');
                if (tcText) tcText.textContent = `S/ ${tipoCambioGlobal.toFixed(2)}`;
                return;
            }
        }
    } catch (e) {
        console.warn('Error al obtener tipo de cambio SUNAT, usando fallback:', e.message || e);
    }

    tipoCambioGlobal = (configGeneral && configGeneral.tipoCambioManual) ? parseFloat(configGeneral.tipoCambioManual) : 3.80;
    const v = document.getElementById('tipoCambioValor');
    const m = document.getElementById('tipoCambioMoneda');
    if (v) v.textContent = tipoCambioGlobal.toFixed(2);
    if (m) m.textContent = 'USD/PEN';
    const tcText = document.getElementById('tipoCambioText');
    if (tcText) tcText.textContent = `S/ ${tipoCambioGlobal.toFixed(2)}`;
}

// --- FALLBACK HTML UNIVERSAL PARA NAVBAR Y FOOTER ---
const NAVBAR_FALLBACK_HTML = `<!-- Navigation Styles -->
<style>
/* CSS Responsive para Navbar #adminNav: evita que se vea amontonado y usa íconos si falta espacio */
#adminNav {
    flex-wrap: nowrap !important;
}
@media (max-width: 1250px) {
    #adminNav .nav-btn-text,
    #adminNav #userEmailShort {
        display: none !important;
    }
    #adminNav .btn,
    #adminNav .dropdown-toggle {
        padding-left: 0.6rem !important;
        padding-right: 0.6rem !important;
    }
    #adminNav .nav-pill-indicator span {
        display: none !important;
    }
    #adminNav .nav-pill-indicator {
        padding-left: 0.6rem !important;
        padding-right: 0.6rem !important;
    }
}
@media (max-width: 1350px) {
    #navLiveSearchInput {
        width: 150px !important;
    }
}
@media (max-width: 991px) {
    #adminNav {
        margin-top: 1rem !important;
        justify-content: flex-start !important;
        flex-wrap: wrap !important;
    }
}
</style>
<!-- Navigation-->
<nav class="navbar navbar-expand-lg navbar-light glass-navbar fixed-top py-2 shadow-sm transition-all" id="mainNavbar">
    <div class="container-fluid px-4 px-lg-5">
        <a class="navbar-brand d-flex align-items-center gap-2" href="index.html">
            <img width="90" class="d-flex transition-all logo-img" alt="edark_logo" src="img/Logo/logo_2.png">
        </a>
        <button class="navbar-toggler border-0 shadow-none p-2" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4 gap-1 fw-semibold align-items-lg-center">
                <li class="nav-item"><a class="nav-link px-3 rounded-pill transition-all" href="index.html"><i class="bi bi-house-door me-1"></i>Inicio</a></li> 
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle px-3 rounded-pill transition-all" id="navbarDropdown" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="bi bi-briefcase me-1"></i>Servicios</a>
                    <ul class="dropdown-menu shadow-lg border-0 rounded-4 p-2 mt-2 glass-dropdown" aria-labelledby="navbarDropdown">
                        <li><a class="dropdown-item rounded-3 py-2 fw-medium" href="consultoria.html"><i class="bi bi-lightbulb text-primary me-2"></i>Consultoría tecnológica</a></li>
                        <li><a class="dropdown-item rounded-3 py-2 fw-medium" href="soporte.html"><i class="bi bi-tools text-primary me-2"></i>Soporte técnico</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li class="dropdown-submenu position-relative">
                            <a class="dropdown-item dropdown-toggle rounded-3 py-2 fw-medium d-flex justify-content-between align-items-center" href="#"><span class="d-flex align-items-center"><i class="bi bi-people text-info me-2"></i>Asesoramiento Tecnológico</span></a>
                            <ul class="dropdown-menu shadow-lg border-0 rounded-4 p-2">
                                <li><a class="dropdown-item rounded-3 py-2" href="asesoramiento-hogar.html"><i class="bi bi-house-door text-success me-2"></i>Hogar</a></li>
                                <li><a class="dropdown-item rounded-3 py-2" href="asesoramiento-empresa.html"><i class="bi bi-building text-primary me-2"></i>Empresa</a></li>
                            </ul>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item rounded-3 py-2 fw-medium" href="mantenimiento.html"><i class="bi bi-gear-wide-connected text-secondary me-2"></i>Mantenimiento y reparación</a></li>
                        <li><a class="dropdown-item rounded-3 py-2 fw-medium" href="recicla.html"><i class="bi bi-recycle text-success me-2"></i>Recicla tecnología</a></li>
                        <li><a class="dropdown-item rounded-3 py-2 fw-medium" href="pc-personalizada.html"><i class="bi bi-pc-display-horizontal text-warning me-2"></i>PC Personalizada</a></li>
                    </ul>
                </li>
                <li class="nav-item"><a class="nav-link px-3 rounded-pill transition-all" href="blog.html"><i class="bi bi-journal-text me-1"></i>Blog</a></li>
                <li class="nav-item"><a class="nav-link px-3 rounded-pill transition-all" href="nosotros.html"><i class="bi bi-info-circle me-1"></i>Nosotros</a></li>
                <li class="nav-item"><a class="nav-link px-3 rounded-pill transition-all" href="contactanos.html"><i class="bi bi-envelope me-1"></i>Contáctanos</a></li>
            </ul>
            
            <!-- Acciones Derecha -->
            <div class="d-flex align-items-center gap-1.5 gap-lg-2 flex-nowrap justify-content-end mt-2 mt-lg-0" id="adminNav">
                <!-- Búsqueda predictiva universal en Navbar -->
                <div class="position-relative d-none d-xl-block" style="width: 230px;">
                    <div class="input-group input-group-sm rounded-pill border bg-white shadow-sm overflow-hidden px-2 py-1 d-flex align-items-center">
                        <i class="bi bi-search text-muted ms-1"></i>
                        <input type="text" class="form-control border-0 bg-transparent ps-2 py-0 live-search-input shadow-none" id="navLiveSearchInput" placeholder="Buscar en eDark..." aria-label="Buscar en eDark" autocomplete="off" style="font-size:0.85rem;">
                    </div>
                    <!-- Dropdown flotante predictivo -->
                    <div class="live-search-dropdown shadow-lg position-absolute start-0 w-100 bg-white border mt-2 rounded-4 p-2 d-none" id="navLiveSearchDropdown" style="z-index: 1060; max-height: 380px; overflow-y: auto; min-width: 310px;"></div>
                </div>

                <!-- Tipo de Cambio Indicador elegante -->
                <div class="nav-pill-indicator d-none d-md-flex align-items-center px-3 py-1 rounded-pill border shadow-sm bg-light text-dark fw-bold" style="font-size: 0.8rem; cursor: default; height: 36px;" title="Tipo de Cambio SUNAT (Soporte Manual/Automático)">
                    <i class="bi bi-currency-exchange text-success me-1.5"></i>
                    <span id="tipoCambioText">TC: S/ 3.80</span>
                </div>

                <!-- Mis Pedidos botón rápido -->
                <a href="mis-pedidos.html" class="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 shadow-sm transition-all" style="height: 36px;" title="Mis Pedidos">
                    <i class="bi bi-box-seam"></i>
                    <span class="nav-btn-text d-none d-sm-inline">Pedidos</span>
                </a>

                <!-- Botón de Carrito en Navbar -->
                <button class="btn btn-primary btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-2 shadow-sm position-relative transition-all" type="button" id="cartBtn" style="background: linear-gradient(135deg, #0d6efd, #0043a8); border:none; height: 36px;" title="Carrito de Compras">
                    <i class="bi bi-cart3 fs-6"></i>
                    <span class="badge bg-danger rounded-pill px-2 py-0.5" id="cartCount" style="font-size:0.75rem;">0</span>
                </button>

                <!-- Menú Usuario / Cuenta -->
                <div class="dropdown">
                    <button class="btn btn-light btn-sm rounded-pill border px-3 py-1 fw-semibold d-flex align-items-center gap-2 shadow-sm dropdown-toggle transition-all" type="button" id="userMenuBtn" data-bs-toggle="dropdown" aria-expanded="false" style="height: 36px;" title="Cuenta de Usuario">
                        <i class="bi bi-person-circle text-primary fs-6"></i>
                        <span id="userEmailShort" class="nav-btn-text" style="max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Ingresar</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2 mt-2 glass-dropdown" aria-labelledby="userMenuBtn" style="min-width: 220px; z-index: 1070;">
                        <li class="px-3 py-2 text-muted small border-bottom mb-1 d-flex flex-column">
                            <span class="fw-bold text-dark">Sesión activa como:</span>
                            <span id="userEmailFull" class="text-truncate text-primary fw-semibold">Invitado</span>
                        </li>
                        <li id="adminLinkLi" class="d-none"><a class="dropdown-item rounded-3 py-2 fw-semibold text-dark" href="admin/dashboard.html"><i class="bi bi-speedometer2 text-primary me-2"></i>Panel Administrador</a></li>
                        <li><a class="dropdown-item rounded-3 py-2 fw-semibold text-dark" href="perfil.html"><i class="bi bi-person-badge text-primary me-2"></i>Mi Perfil de Usuario</a></li>
                        <li><a class="dropdown-item rounded-3 py-2 fw-semibold text-dark" href="mis-pedidos.html"><i class="bi bi-box-seam text-success me-2"></i>Mis Pedidos</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li id="loginLi"><a class="dropdown-item rounded-3 py-2 fw-semibold text-primary" href="perfil.html"><i class="bi bi-person-plus me-2"></i>Registro / Iniciar Sesión</a></li>
                        <li id="logoutLi" class="d-none"><button class="dropdown-item rounded-3 py-2 fw-semibold text-danger w-100 text-start" type="button" id="logoutBtnNav"><i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión</button></li>
                    </ul>
                </div>

                <span id="userEmail" class="d-none"></span>

                <!-- Switch modo oscuro/claro -->
                <div class="form-check form-switch m-0 d-flex align-items-center ps-2">
                    <input class="form-check-input ms-0 me-1 shadow-none" type="checkbox" role="switch" id="modoOscuroSwitch" aria-label="Alternar modo oscuro" title="Alternar modo oscuro" style="cursor: pointer; width: 2.3em; height: 1.25em;">
                    <label class="form-check-label m-0 d-flex align-items-center" for="modoOscuroSwitch" id="modoOscuroLabel" aria-label="Alternar modo oscuro" style="color: inherit; cursor: pointer; font-size:1.15rem;"><i class="bi bi-moon"></i><span class="visually-hidden">Alternar modo oscuro</span></label>
                </div>
            </div>
        </div>
    </div>
</nav>

<script>
// Script integrado y auto-ejecutado para Navbar moderna
(function() {
    function actualizarLogoNav() {
        const logo = document.querySelector('.navbar-brand img');
        if (!logo) return;
        if (document.body.classList.contains('modo-oscuro')) {
            logo.src = 'img/Logo/logo_1.png';
        } else {
            logo.src = 'img/Logo/logo_2.png';
        }
    }

    function initDarkModeSwitch() {
        const switchOscuro = document.getElementById('modoOscuroSwitch');
        const labelOscuro = document.getElementById('modoOscuroLabel');
        
        if (!switchOscuro) return;

        const dark = localStorage.getItem('modoOscuro') !== 'false';
        if (dark) {
            document.body.classList.add('modo-oscuro');
            document.documentElement.classList.add('modo-oscuro');
            switchOscuro.checked = true;
            if (labelOscuro) labelOscuro.innerHTML = '<i class="bi bi-sun text-warning"></i><span class="visually-hidden">Alternar modo oscuro</span>';
        } else {
            switchOscuro.checked = false;
            if (labelOscuro) labelOscuro.innerHTML = '<i class="bi bi-moon text-primary"></i><span class="visually-hidden">Alternar modo oscuro</span>';
        }

        switchOscuro.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('modo-oscuro');
                document.documentElement.classList.add('modo-oscuro');
                localStorage.setItem('modoOscuro', 'true');
                if (labelOscuro) labelOscuro.innerHTML = '<i class="bi bi-sun text-warning"></i><span class="visually-hidden">Alternar modo oscuro</span>';
            } else {
                document.body.classList.remove('modo-oscuro');
                document.documentElement.classList.remove('modo-oscuro');
                localStorage.setItem('modoOscuro', 'false');
                if (labelOscuro) labelOscuro.innerHTML = '<i class="bi bi-moon text-primary"></i><span class="visually-hidden">Alternar modo oscuro</span>';
            }
            actualizarLogoNav();
        });

        actualizarLogoNav();
    }

    function destacarEnlaceActivo() {
        try {
            const path = window.location.pathname;
            const page = path.split('/').pop() || 'index.html';
            const links = document.querySelectorAll('.nav-link, .dropdown-item');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href === page || href.includes(page))) {
                    link.classList.add('active');
                    const parentDropdown = link.closest('.dropdown-menu');
                    if (parentDropdown && parentDropdown.parentElement) {
                        const toggle = parentDropdown.parentElement.querySelector('.dropdown-toggle');
                        if (toggle) toggle.classList.add('active');
                    }
                }
            });
        } catch (e) {
            console.error(e);
        }
    }

    function initUserMenuState() {
        if (typeof auth !== 'undefined' && auth.onAuthStateChanged) {
            auth.onAuthStateChanged(user => {
                const userEmailShort = document.getElementById('userEmailShort');
                const userEmailFull = document.getElementById('userEmailFull');
                const adminLinkLi = document.getElementById('adminLinkLi');
                const loginLi = document.getElementById('loginLi');
                const logoutLi = document.getElementById('logoutLi');

                if (user) {
                    if (userEmailShort) userEmailShort.textContent = user.email ? user.email.split('@')[0] : 'Admin';
                    if (userEmailFull) userEmailFull.textContent = user.email || 'Admin eDark';
                    if (adminLinkLi) adminLinkLi.classList.remove('d-none');
                    if (loginLi) loginLi.classList.add('d-none');
                    if (logoutLi) logoutLi.classList.remove('d-none');
                } else {
                    if (userEmailShort) userEmailShort.textContent = 'Ingresar';
                    if (userEmailFull) userEmailFull.textContent = 'Invitado';
                    if (adminLinkLi) adminLinkLi.classList.add('d-none');
                    if (loginLi) loginLi.classList.remove('d-none');
                    if (logoutLi) logoutLi.classList.add('d-none');
                }
            });
        }
    }

    initDarkModeSwitch();
    destacarEnlaceActivo();
    setTimeout(initUserMenuState, 100);
})();
</script>`;

const FOOTER_FALLBACK_HTML = `<footer class="py-5 bg-dark text-white">
    <div class="container">
        <div class="row gy-4">
            <div class="col-md-4">
                <a href="index.html" class="d-inline-block mb-2">
                    <img src="img/Logo/logo_1.png" alt="eDark Logo" width="100">
                </a>
                <p class="small">
                    eDark E.I.R.L. - Soluciones tecnológicas, soporte, consultoría y reciclaje responsable. Innovando para tu hogar y empresa.
                </p>
            </div>
            <div class="col-md-2">
                <h6 class="text-uppercase fw-bold mb-3">Enlaces</h6>
                <ul class="list-unstyled">
                    <li><a href="index.html" class="text-white text-decoration-none">Inicio</a></li>
                    <li><a href="blog.html" class="text-white text-decoration-none">Blog</a></li>
                    <li><a href="nosotros.html" class="text-white text-decoration-none">Nosotros</a></li>
                    <li><a href="contactanos.html" class="text-white text-decoration-none">Contáctanos</a></li>
                    <li><a href="recicla.html" class="text-white text-decoration-none">Recicla tecnología</a></li>
                </ul>
            </div>
            <div class="col-md-3">
                <h6 class="text-uppercase fw-bold mb-3">Servicios</h6>
                <ul class="list-unstyled">
                    <li><a href="consultoria.html" class="text-white text-decoration-none">Consultoría tecnológica</a></li>
                    <li><a href="soporte.html" class="text-white text-decoration-none">Soporte técnico</a></li>
                    <li><a href="mantenimiento.html" class="text-white text-decoration-none">Mantenimiento y reparación</a></li>
                    <li><a href="asesoramiento-hogar.html" class="text-white text-decoration-none">Asesoramiento hogar</a></li>
                    <li><a href="asesoramiento-empresa.html" class="text-white text-decoration-none">Asesoramiento empresa</a></li>
                </ul>
            </div>
            <div class="col-md-3">
                <h6 class="text-uppercase fw-bold mb-3">Contacto</h6>
                <ul class="list-unstyled small">
                    <li><i class="bi bi-envelope"></i> <a href="mailto:edark-import@gmail.com" class="text-white text-decoration-none">edark-import@gmail.com</a></li>
                    <li><i class="bi bi-telephone"></i> <a href="tel:+51916907657" class="text-white text-decoration-none">+51 916 907 657</a></li>
                    <li><i class="bi bi-geo-alt"></i> Lima, Perú</li>
                </ul>
                <div class="mt-3">
                    <a href="https://www.facebook.com/profile.php?id=61578651951463" target="_blank" rel="noopener noreferrer" class="text-white me-3 fs-5"><i class="bi bi-facebook"></i></a>
                    <a href="https://www.instagram.com/edarkperu/" target="_blank" rel="noopener noreferrer" class="text-white me-3 fs-5"><i class="bi bi-instagram"></i></a>
                    <a href="https://wa.me/51916907657" target="_blank" rel="noopener noreferrer" class="text-white me-3 fs-5"><i class="bi bi-whatsapp"></i></a>
                    <a href="https://www.tiktok.com/@edark_peru?lang=es" target="_blank" rel="noopener noreferrer" class="text-white me-3 fs-5"><i class="bi bi-tiktok"></i></a>
                </div>
            </div>
        </div>
        <hr class="border-secondary my-4">
        <div class="row">
            <div class="col text-center small">
                &copy; EDARK E.I.R.L. 2024 &mdash; Todos los derechos reservados.
                <a href="politica-privacidad.html" class="text-white text-decoration-underline ms-2">Política de privacidad</a>
                <a href="terminos-condiciones.html" class="text-white text-decoration-underline ms-2">Términos y condiciones</a>
            </div>
        </div>
    </div>
</footer>`;

// --- CARGA DINÁMICA GLOBAL DE NAVBAR Y FOOTER ---
async function cargarNavbarYFooterGlobal() {
    const navbarTarget = document.getElementById('navbar') || document.getElementById('navbar-container');
    const footerTarget = document.getElementById('footer') || document.getElementById('footer-container');

    if (navbarTarget && navbarTarget.innerHTML.trim() === '') {
        let html = null;
        if (window.location.protocol !== 'file:') {
            try {
                const res = await fetch('navbar.html');
                if (res.ok) {
                    html = await res.text();
                } else {
                    const resAlt = await fetch('../navbar.html');
                    if (resAlt.ok) html = await resAlt.text();
                }
            } catch (e) {
                console.warn('Fetch de navbar falló, usando fallback integrado:', e.message);
            }
        }

        if (!html) {
            html = NAVBAR_FALLBACK_HTML;
        }

        if (html && navbarTarget.innerHTML.trim() === '') {
            navbarTarget.innerHTML = html;
            // Ejecutar scripts del navbar
            const scripts = navbarTarget.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                if (oldScript.src) {
                    newScript.src = oldScript.src;
                } else {
                    newScript.textContent = oldScript.textContent;
                }
                document.body.appendChild(newScript);
                oldScript.remove();
            });
            console.log('Navbar dinámico cargado.');
            if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
            if (typeof inicializarBusquedaPredictiva === 'function') inicializarBusquedaPredictiva();
            if (typeof inicializarChimueloIA === 'function') inicializarChimueloIA();
            if (typeof window.sincronizarEstadoNavbarUsuario === 'function') window.sincronizarEstadoNavbarUsuario();
        }
    }

    if (footerTarget && footerTarget.innerHTML.trim() === '') {
        let htmlFooter = null;
        if (window.location.protocol !== 'file:') {
            try {
                const res = await fetch('footer.html');
                if (res.ok) {
                    htmlFooter = await res.text();
                } else {
                    const resAlt = await fetch('../footer.html');
                    if (resAlt.ok) htmlFooter = await resAlt.text();
                }
            } catch (e) {
                console.warn('Fetch de footer falló, usando fallback integrado:', e.message);
            }
        }

        if (!htmlFooter) {
            htmlFooter = FOOTER_FALLBACK_HTML;
        }

        if (htmlFooter && footerTarget.innerHTML.trim() === '') {
            footerTarget.innerHTML = htmlFooter;
            console.log('Footer dinámico cargado.');
        }
    }
}

// Ejecutar inmediatamente la carga del Navbar y Footer en cuanto el script se procese
cargarNavbarYFooterGlobal();
setTimeout(cargarNavbarYFooterGlobal, 50);

async function inicializarAppYCargarComponentes() {
    await cargarNavbarYFooterGlobal();

    // Asegurar que Firebase esté inicializado antes de proceder
    if (typeof db === 'undefined' || !db) {
        console.warn('Firebase DB no inicializado o en modo sin conexión/file://. Verifica firebase-config.js');
        // Reintentar brevemente si es por delay de carga
        setTimeout(async () => {
            db = window.db || (typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore() : null);
            if (db) {
                await iniciarTodo();
            }
        }, 1000);
        return;
    }
    await iniciarTodo();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAppYCargarComponentes);
} else {
    inicializarAppYCargarComponentes();
}

async function iniciarTodo() {
    console.log('Iniciando carga de la aplicación...');
    try {
        // Ejecutar inicializaciones en paralelo para mayor velocidad
        const [tc, config] = await Promise.allSettled([
            inicializarTipoCambioSunat(),
            cargarConfigGeneral()
        ]);
        console.log('Tipo de cambio y Config General procesados.');
    } catch (e) {
        console.error('Error en inicializaciones base:', e);
    }

    // Solo cargar filtros y productos si el contenedor existe (catálogo/inicio)
    if (document.getElementById('productos')) {
        try {
            console.log('Cargando filtros dinámicos...');
            await cargarFiltrosDinamicos();
            renderBadges();
        } catch (e) {
            console.error('Error al cargar filtros:', e);
        }

        // Verificar si existe parámetro de búsqueda en URL (?buscar= o ?q=) al llegar desde otra página
        try {
            const params = new URLSearchParams(window.location.search);
            const queryBusqueda = params.get('buscar') || params.get('q');
            if (queryBusqueda) {
                window.textoBusqueda = queryBusqueda.trim().toLowerCase();
                const inputBuscador = document.getElementById('buscadorProductos');
                if (inputBuscador) inputBuscador.value = queryBusqueda.trim();
            }
        } catch (e) {}

        try {
            console.log('Llamando a mostrarProductos...');
            mostrarProductos();
        } catch (e) {
            console.error('Error al llamar a mostrarProductos:', e);
        }
    }
}

// Cargar configuración general desde Firestore
async function cargarConfigGeneral() {
    try {
        if (!db) return;
        const snap = await db.collection('config').doc('general').get();
        configGeneral = snap.exists ? snap.data() : {};
    } catch (e) {
        console.warn('No se pudo cargar config/general:', e.message);
        configGeneral = {};
    }
}

// Calcular precio para mostrar en tienda usando reglas
function calcularPrecioProducto(prod) {
    if (!prod) return "0.00";
    const precioCompra = parseFloat(prod.precioCompra || 0);
    const moneda = prod.moneda || 'USD';
    const tipoGanancia = prod.tipoGanancia || 'porcentaje';
    const valorGanancia = parseFloat(prod.valorGanancia != null ? prod.valorGanancia : 30);

    // Tipo de cambio: usar manual si está habilitado
    let tc = tipoCambioGlobal;
    try {
        if (configGeneral && configGeneral.usarTcManual && configGeneral.tipoCambioManual) {
            tc = parseFloat(configGeneral.tipoCambioManual) || tc;
        }
    } catch { }

    // Base en soles
    let base;
    if (precioCompra > 0) {
        base = moneda === 'USD' ? precioCompra * tc : precioCompra;
    } else {
        base = parseFloat(prod.precio || 0) || 0;
    }

    // IGV desde config (default 18%)
    const igv = (configGeneral && typeof configGeneral.igv === 'number') ? configGeneral.igv : 18;
    const conIgv = base * (1 + igv / 100);

    let precioFinal;
    if (tipoGanancia === 'monto') {
        precioFinal = conIgv + (isNaN(valorGanancia) ? 0 : valorGanancia);
    } else {
        precioFinal = conIgv * (1 + (isNaN(valorGanancia) ? 0 : (valorGanancia / 100)));
    }

    if (!precioFinal || isNaN(precioFinal) || precioFinal <= 0) {
        precioFinal = parseFloat(prod.precio || 0) || 0;
    }
    return Number(precioFinal).toFixed(2);
}

// --- FUNCIONES DE FILTROS Y PAGINACIÓN ---
// Filtros anidados y filtro de precio
const camposFiltro = [
    { campo: "categoria", label: "Categoría" },
    { campo: "subcategoria", label: "Subcategoría", parent: "categoria" },
    { campo: "marca", label: "Marca" },
    { campo: "capacidad", label: "Capacidad" },
    { campo: "modelo", label: "Modelo" },
    { campo: "dimension", label: "Dimensión" }
];

let valoresFiltro = {};
let subcategoriasPorCategoria = {};
let filtrosSeleccionados = {};
camposFiltro.forEach(f => filtrosSeleccionados[f.campo] = []);
// Filtro de precio
let precioMin = 0, precioMax = 5000, precioFiltroMin = 0, precioFiltroMax = 5000;

// 1. Obtiene todos los valores únicos de cada campo desde Firestore
async function cargarFiltrosDinamicos() {
    try {
        if (!db) return;
        const snapshot = await db.collection('productos').get();
        valoresFiltro = {};
        subcategoriasPorCategoria = {};
        camposFiltro.forEach(f => valoresFiltro[f.campo] = new Set());
        let precios = [];
        
        if (snapshot.empty) {
            console.log('No se encontraron productos para inicializar filtros.');
            generarHtmlFiltros();
            return;
        }

        snapshot.forEach(doc => {
            const prod = doc.data();
            camposFiltro.forEach(f => {
                if (prod[f.campo]) valoresFiltro[f.campo].add(prod[f.campo]);
            });
            // Relaciona subcategoría con categoría
            if (prod.categoria && prod.subcategoria) {
                if (!subcategoriasPorCategoria[prod.categoria]) subcategoriasPorCategoria[prod.categoria] = new Set();
                subcategoriasPorCategoria[prod.categoria].add(prod.subcategoria);
            }
            // Usar precio calculado para rangos de filtro
            const pc = parseFloat(calcularPrecioProducto(prod));
            if (!isNaN(pc) && pc > 0) precios.push(pc);
        });

        // Filtro de precio con valores seguros
        if (precios.length > 0) {
            precioMin = Math.floor(Math.min(...precios));
            precioMax = Math.ceil(Math.max(...precios));
            // Evitar que min y max sean iguales para que el slider funcione
            if (precioMin === precioMax) precioMax = precioMin + 1;
        } else {
            precioMin = 0;
            precioMax = 5000;
        }
        
        precioFiltroMin = precioMin;
        precioFiltroMax = precioMax;

        generarHtmlFiltros();
    } catch (e) {
        console.error('Error en cargarFiltrosDinamicos:', e);
    }
}

function generarHtmlFiltros() {
    // Genera el HTML de los filtros
    let html = '';

    // Filtro de precio
    html += `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#filter-precio">
                    Precio (S/)
                </button>
            </h2>
            <div id="filter-precio" class="accordion-collapse collapse">
                <div class="accordion-body">
                    <div class="mb-2">
                        <label for="precioMin" class="form-label">Mínimo: <span id="precioMinLabel">${precioMin}</span></label>
                        <input type="range" class="form-range" min="${precioMin}" max="${precioMax}" value="${precioMin}" id="precioMin">
                    </div>
                    <div>
                        <label for="precioMax" class="form-label">Máximo: <span id="precioMaxLabel">${precioMax}</span></label>
                        <input type="range" class="form-range" min="${precioMin}" max="${precioMax}" value="${precioMax}" id="precioMax">
                    </div>
                </div>
            </div>
        </div>
        `;

    // Categoría y subcategoría anidados
    html += `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#filter-categoria">
                    Categoría
                </button>
            </h2>
            <div id="filter-categoria" class="accordion-collapse collapse">
                <div class="accordion-body" id="categoria-body">
        `;
    
    if (valoresFiltro["categoria"]) {
        Array.from(valoresFiltro["categoria"]).sort().forEach(categoria => {
            const catId = `filter-categoria-${categoria.replace(/[^a-zA-Z0-9]/g, '')}`;
            html += `
                    <div class="form-check mb-1">
                        <input class="form-check-input filter-checkbox" type="checkbox" value="${categoria}" id="${catId}" data-campo="categoria">
                        <label class="form-check-label fw-bold" for="${catId}">${categoria}</label>
                    </div>
                `;
            // Subcategorías anidadas
            if (subcategoriasPorCategoria[categoria]) {
                Array.from(subcategoriasPorCategoria[categoria]).sort().forEach(subcat => {
                    const subcatId = `filter-subcategoria-${subcat.replace(/[^a-zA-Z0-9]/g, '')}-cat-${categoria.replace(/[^a-zA-Z0-9]/g, '')}`;
                    html += `
                            <div class="form-check ms-4">
                                <input class="form-check-input filter-checkbox" type="checkbox" value="${subcat}" id="${subcatId}" data-campo="subcategoria" data-parent="${categoria}">
                                <label class="form-check-label" for="${subcatId}">${subcat}</label>
                            </div>
                        `;
                });
            }
        });
    }
    html += `</div></div></div>`;

    // Resto de filtros
    ["marca", "capacidad", "modelo", "dimension"].forEach(campo => {
        const label = camposFiltro.find(f => f.campo === campo).label;
        html += `
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#filter-${campo}">
                        ${label}
                    </button>
                </h2>
                <div id="filter-${campo}" class="accordion-collapse collapse">
                    <div class="accordion-body">
            `;
        if (valoresFiltro[campo]) {
            Array.from(valoresFiltro[campo]).sort().forEach(valor => {
                const id = `filter-${campo}-${valor.replace(/[^a-zA-Z0-9]/g, '')}`;
                html += `
                        <div class="form-check">
                            <input class="form-check-input filter-checkbox" type="checkbox" value="${valor}" id="${id}" data-campo="${campo}">
                            <label class="form-check-label" for="${id}">${valor}</label>
                        </div>
                    `;
            });
        }
        html += `</div></div></div>`;
    });

    const filterContainer = document.getElementById('dynamic-filters');
    if (filterContainer) {
        filterContainer.innerHTML = html;
        asignarEventosFiltros();
        actualizarFiltrosDinamicos();
    }
}

function asignarEventosFiltros() {
    // Eventos para filtros
    document.querySelectorAll('.filter-checkbox').forEach(cb => {
        cb.addEventListener('change', function () {
            const campo = this.dataset.campo;
            const valor = this.value;

            if (this.checked) {
                if (!filtrosSeleccionados[campo].includes(valor)) {
                    filtrosSeleccionados[campo].push(valor);
                }
            } else {
                filtrosSeleccionados[campo] = filtrosSeleccionados[campo].filter(v => v !== valor);
                if (campo === 'categoria') ocultarYLimpiarSubcategorias(valor);
            }
            actualizarFiltrosDinamicos();
            renderBadges();
            renderProductosPaginados();
        });
    });

    // Filtro de precio
    const pMinInput = document.getElementById('precioMin');
    const pMaxInput = document.getElementById('precioMax');
    
    if (pMinInput) {
        pMinInput.addEventListener('input', function () {
            let min = parseInt(this.value);
            let max = parseInt(pMaxInput.value);
            if (min > max) {
                min = max;
                this.value = min;
            }
            precioFiltroMin = min;
            document.getElementById('precioMinLabel').textContent = min;
            actualizarFiltrosDinamicos();
            renderProductosPaginados();
        });
    }
    
    if (pMaxInput) {
        pMaxInput.addEventListener('input', function () {
            let max = parseInt(this.value);
            let min = parseInt(pMinInput.value);
            if (max < min) {
                max = min;
                this.value = max;
            }
            precioFiltroMax = max;
            document.getElementById('precioMaxLabel').textContent = max;
            actualizarFiltrosDinamicos();
            renderProductosPaginados();
        });
    }
}

    // Funciones auxiliares para mostrar/ocultar subcategorías
    function mostrarSubcategorias(categoria) {
        actualizarFiltrosDinamicos();
    }

    function ocultarYLimpiarSubcategorias(categoria) {
        document.querySelectorAll(`[data-parent="${categoria}"]`).forEach(subcatCheckbox => {
            subcatCheckbox.checked = false;
            const valor = subcatCheckbox.value;
            filtrosSeleccionados['subcategoria'] = (filtrosSeleccionados['subcategoria'] || []).filter(v => v !== valor);
        });
        actualizarFiltrosDinamicos();
    }

    // Ocultar todas las subcategorías inicialmente
    document.querySelectorAll('[data-campo="subcategoria"]').forEach(subcatCheckbox => {
        subcatCheckbox.closest('.form-check').style.display = 'none';
    });

    // Función para actualizar filtros dinámicamente y anidados en base a los productos registrados
    function actualizarFiltrosDinamicos() {
        if (!productosCache || !Array.isArray(productosCache)) return;

        // Obtener productos que coinciden con los filtros actuales
        const productosFiltrados = productosCache.filter(producto => {
            // Validar filtro de precio
            const p = parseFloat(window.calcularPrecioProducto ? window.calcularPrecioProducto(producto) : (producto.precioVenta || producto.precio || 0));
            if (!isNaN(p) && (p < precioFiltroMin || p > precioFiltroMax)) {
                return false;
            }

            for (const campo of Object.keys(filtrosSeleccionados)) {
                const valores = filtrosSeleccionados[campo];
                if (valores && valores.length > 0) {
                    if (campo === 'subcategoria') {
                        const categoriasSeleccionadas = filtrosSeleccionados['categoria'] || [];
                        if (categoriasSeleccionadas.length > 0) {
                            if (!categoriasSeleccionadas.includes(producto.categoria)) return false;
                        }
                        if (!valores.includes(producto.subcategoria)) return false;
                    } else if (campo === 'categoria') {
                        if (!valores.includes(producto.categoria)) return false;
                    } else {
                        const productoValor = producto[campo] || '';
                        if (!valores.includes(productoValor)) return false;
                    }
                }
            }
            return true;
        });

        // Calcular valores y conteos disponibles para cada campo
        const valoresDisponibles = {};
        const conteos = {};
        camposFiltro.forEach(f => {
            valoresDisponibles[f.campo] = new Set();
            conteos[f.campo] = {};
        });

        productosFiltrados.forEach(prod => {
            camposFiltro.forEach(f => {
                const val = prod[f.campo];
                if (val) {
                    valoresDisponibles[f.campo].add(val);
                    conteos[f.campo][val] = (conteos[f.campo][val] || 0) + 1;
                }
            });
        });

        const catSeleccionadas = filtrosSeleccionados['categoria'] || [];

        // Actualizar visibilidad, habilitación y conteo dinámico en la interfaz
        camposFiltro.forEach(campoObj => {
            const campo = campoObj.campo;
            const checkboxes = document.querySelectorAll(`[data-campo="${campo}"]`);

            checkboxes.forEach(cb => {
                const valor = cb.value;
                const estaDisponible = valoresDisponibles[campo].has(valor);
                const estaSeleccionado = (filtrosSeleccionados[campo] || []).includes(valor);

                if (campo === 'subcategoria') {
                    const parentCat = cb.dataset.parent;
                    const parentActivo = catSeleccionadas.length === 0 || catSeleccionadas.includes(parentCat);
                    const visible = parentActivo && (estaDisponible || estaSeleccionado);
                    cb.closest('.form-check').style.display = visible ? 'block' : 'none';
                    cb.disabled = !estaDisponible && !estaSeleccionado;
                } else {
                    cb.closest('.form-check').style.display = (estaDisponible || estaSeleccionado) ? 'block' : 'none';
                    cb.disabled = !estaDisponible && !estaSeleccionado;
                }

                // Actualizar contadores de productos en cada opción
                const label = document.querySelector(`label[for="${cb.id}"]`);
                if (label) {
                    const count = conteos[campo][valor] || 0;
                    let cleanText = label.textContent.replace(/\(\d+\)$/, '').trim();
                    label.innerHTML = `${cleanText} <span class="badge bg-secondary bg-opacity-10 text-secondary ms-1 fw-normal" style="font-size:0.75em;">(${count})</span>`;
                }

                if (!estaDisponible && !estaSeleccionado && cb.checked) {
                    cb.checked = false;
                    filtrosSeleccionados[campo] = (filtrosSeleccionados[campo] || []).filter(v => v !== valor);
                }
            });
        });
    }



function renderBadges() {
    const container = document.getElementById('selected-filters');
    if (!container) return;
    container.innerHTML = '';
    camposFiltro.forEach(f => {
        filtrosSeleccionados[f.campo].forEach(valor => {
            let id;
            if (f.campo === "subcategoria") {
                // Busca la categoría asociada para el id
                let cat = null;
                for (const c in subcategoriasPorCategoria) {
                    if (subcategoriasPorCategoria[c].has(valor)) {
                        cat = c;
                        break;
                    }
                }
                id = `filter-subcategoria-${valor.replace(/[^a-zA-Z0-9]/g, '')}-cat-${cat ? cat.replace(/[^a-zA-Z0-9]/g, '') : ''}`;
            } else {
                id = `filter-${f.campo}-${valor.replace(/[^a-zA-Z0-9]/g, '')}`;
            }
            container.innerHTML += `<span class="mt-2 badge bg-primary me-2 filter-badge" data-id="${id}">${valor} <button type="button" class="btn-close btn-close-white ms-1 remove-filter" aria-label="Close" data-id="${id}" data-campo="${f.campo}" data-valor="${valor}"></button></span>`;
        });
    });
    // Badge de precio
    if (precioFiltroMin > precioMin || precioFiltroMax < precioMax) {
        container.innerHTML += `<span class="mt-2 badge bg-info me-2 filter-badge" data-id="precio-badge">S/${precioFiltroMin} - S/${precioFiltroMax} <button type="button" class="btn-close btn-close-white ms-1 remove-filter" aria-label="Close" data-id="precio-badge" data-campo="precio"></button></span>`;
    }
}

const selectedFiltersElem = document.getElementById('selected-filters');
if (selectedFiltersElem) {
    selectedFiltersElem.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-filter')) {
            const campo = e.target.dataset.campo;
            const valor = e.target.dataset.valor;
            const id = e.target.dataset.id;
            if (campo === "precio") {
                // Reset precio
                precioFiltroMin = precioMin;
                precioFiltroMax = precioMax;
                const pMinEl = document.getElementById('precioMin');
                const pMaxEl = document.getElementById('precioMax');
                const pMinLbl = document.getElementById('precioMinLabel');
                const pMaxLbl = document.getElementById('precioMaxLabel');
                if (pMinEl) pMinEl.value = precioMin;
                if (pMaxEl) pMaxEl.value = precioMax;
                if (pMinLbl) pMinLbl.textContent = precioMin;
                if (pMaxLbl) pMaxLbl.textContent = precioMax;
            } else {
                const cb = document.getElementById(id);
                if (cb) cb.checked = false;
                if (filtrosSeleccionados[campo]) {
                    filtrosSeleccionados[campo] = filtrosSeleccionados[campo].filter(v => v !== valor);
                }
            }
            renderBadges();
            mostrarProductos();
        }
    });
}

function renderPaginacion(totalPaginas) {
    const pag = document.getElementById('paginacionProductos');
    if (!pag) return;
    pag.innerHTML = '';
    if (totalPaginas <= 1) return;
    let html = '<nav><ul class="pagination justify-content-center">';
    for (let i = 1; i <= totalPaginas; i++) {
        html += `<li class="page-item${i === paginaActual ? ' active' : ''}">
                <button class="page-link" data-pag="${i}">${i}</button>
            </li>`;
    }
    html += '</ul></nav>';
    pag.innerHTML = html;
    pag.querySelectorAll('.page-link').forEach(btn => {
        btn.addEventListener('click', function () {
            paginaActual = parseInt(this.dataset.pag);
            renderProductosPaginados(true);
        });
    });
}

// Modifica renderProductosPaginados para filtrar por búsqueda
// --- RENDERIZA LOS PRODUCTOS Y AGREGA BOTÓN EDITAR SOLO PARA ADMIN ---
function renderProductosPaginados(shouldScroll = false) {
    const contenedor = document.getElementById('productos');
    if (!contenedor) return;

    let productos = productosCache.filter(productoCoincideFiltros);
    // Ordenamiento y paginación
    const ordenarEl = document.getElementById('ordenarSelect');
    const orden = ordenarEl ? ordenarEl.value : '';
    if (orden === "precio-asc") {
        productos.sort((a, b) => parseFloat(calcularPrecioProducto(a)) - parseFloat(calcularPrecioProducto(b)));
    } else if (orden === "precio-desc") {
        productos.sort((a, b) => parseFloat(calcularPrecioProducto(b)) - parseFloat(calcularPrecioProducto(a)));
    } else if (orden === "capacidad-asc") {
        productos.sort((a, b) => parseCapacidad(a.capacidad) - parseCapacidad(b.capacidad));
    } else if (orden === "capacidad-desc") {
        productos.sort((a, b) => parseCapacidad(b.capacidad) - parseCapacidad(a.capacidad));
    }
    const totalPaginas = Math.ceil(productos.length / productosPorPagina);
    if (paginaActual > totalPaginas) paginaActual = totalPaginas || 1;
    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    const productosPagina = productos.slice(inicio, fin);
    contenedor.innerHTML = '';

    // Actualizar contadores en la nueva barra del catálogo si existen
    const contadorEl = document.getElementById('contadorProductosText');
    if (contadorEl) {
        contadorEl.textContent = `${productos.length} ${productos.length === 1 ? 'producto' : 'productos'}`;
    }
    const infoPagEl = document.getElementById('infoPaginacionText');
    if (infoPagEl) {
        infoPagEl.textContent = productos.length > 0
            ? `Mostrando ${inicio + 1} - ${Math.min(fin, productos.length)} de ${productos.length} disponibles`
            : 'No se encontraron productos con esos criterios';
    }

    // Detecta si el usuario está autenticado (admin)
    const user = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;

    productosPagina.forEach((prod, idx) => {
        const precioSoles = calcularPrecioProducto(prod);
        const precioDolares = typeof prod.precio === 'number' && typeof tipoCambio === 'number' && tipoCambio > 0
            ? (prod.precio / tipoCambio).toFixed(2)
            : null;

        contenedor.innerHTML += `
            <div class="col">
                <div class="card h-100 border-0 shadow-sm rounded-4 position-relative overflow-hidden product-card-premium transition-all bg-white">
                    <!-- Badge superior -->
                    <div class="position-absolute top-0 start-0 m-3 z-2 d-flex flex-column gap-1 pointer-events-none">
                        ${prod.enStock !== false ? '<span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1 small fw-bold"><i class="bi bi-check-circle-fill me-1"></i>En Stock</span>' : '<span class="badge bg-secondary rounded-pill px-2 py-1 small">Agotado</span>'}
                    </div>
                    
                    <!-- Contenedor de Imagen -->
                    <a href="producto.html?id=${prod.id}" class="text-decoration-none text-dark d-flex align-items-center justify-content-center p-4 bg-light position-relative overflow-hidden product-img-wrapper" style="height: 230px;">
                        <img class="img-fluid transition-all product-img" src="${safeImageUrl(prod.imagenUrl || prod.imagen || '')}" alt="${sanitize(prod.nombre)}" loading="lazy" decoding="async" style="max-height: 180px; object-fit: contain;" />
                    </a>

                    <!-- Cuerpo de la Tarjeta -->
                    <div class="card-body p-3 d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex align-items-center justify-content-between mb-1">
                                <small class="text-muted text-uppercase fw-semibold" style="font-size: 0.75rem;">${sanitize(prod.marca || 'eDark Alpha')}</small>
                                <div class="d-flex text-warning small" style="font-size: 0.75rem;">
                                    <i class="bi bi-star-fill"></i>
                                    <i class="bi bi-star-fill"></i>
                                    <i class="bi bi-star-fill"></i>
                                    <i class="bi bi-star-fill"></i>
                                    <i class="bi bi-star-fill"></i>
                                </div>
                            </div>
                            <a href="producto.html?id=${prod.id}" class="text-decoration-none text-dark">
                                <h6 class="fw-bold mb-2 text-dark product-title line-clamp-2" title="${sanitize(prod.nombre || 'Producto')}">${sanitize(prod.nombre || 'Producto')}</h6>
                            </a>
                        </div>

                        <div class="mt-2 pt-2 border-top">
                            <div class="d-flex align-items-baseline justify-content-between mb-3">
                                <div>
                                    <span class="fs-5 fw-bolder text-primary">S/ ${sanitize(precioSoles)}</span>
                                    ${precioDolares ? `<small class="text-muted d-block" style="font-size:0.75rem;">$ ${precioDolares} USD</small>` : ''}
                                </div>
                                <span class="badge bg-light text-primary border rounded-pill small px-2 py-1"><i class="bi bi-truck me-1"></i>Envío Rápido</span>
                            </div>

                            <div class="d-flex gap-2">
                                <a href="producto.html?id=${prod.id}" class="btn btn-outline-dark btn-sm rounded-pill flex-grow-1 fw-semibold transition-all d-flex align-items-center justify-content-center gap-1">
                                    <span>Detalles</span>
                                </a>
                                <button type="button" class="btn btn-primary btn-sm rounded-pill px-3 fw-semibold transition-all d-flex align-items-center justify-content-center gap-1 shadow-sm" onclick="agregarAlCarritoDesdeCard('${prod.id}', event)" title="Agregar al Carrito" style="background: linear-gradient(135deg, #0d6efd, #0043a8); border:none;">
                                    <i class="bi bi-cart-plus-fill fs-6"></i>
                                </button>
                                ${window.currentUserIsAdmin ? `<button class="btn btn-sm btn-outline-secondary rounded-circle btn-editar-producto d-flex align-items-center justify-content-center flex-shrink-0" data-id="${prod.id}" title="Editar" style="width:32px;height:32px;"><i class="bi bi-pencil"></i></button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    if (contenedor.innerHTML === '') {
        contenedor.innerHTML = `<div class="col-12 text-center text-muted py-5 my-4 bg-white rounded-4 shadow-sm border"><i class="bi bi-search fs-1 text-muted mb-2 d-block"></i><h5 class="fw-bold text-dark">No se encontraron productos</h5><p class="m-0 small">Intenta ajustar o limpiar los filtros seleccionados.</p></div>`;
    }
    asignarEventosProductos();
    renderPaginacion(totalPaginas);

    // --- Scroll al primer producto al cambiar de página ---
    if (shouldScroll) {
        setTimeout(() => {
            const primerCard = contenedor.querySelector('.card') || contenedor;
            if (primerCard) {
                primerCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 0);
    }
}

// --- AGREGA EVENTO PARA BOTÓN EDITAR SOLO PARA ADMIN ---
function asignarEventosProductos() {
    // Evento Ver Detalles
    document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
        btn.addEventListener('click', function () {
            const idx = parseInt(this.getAttribute('data-idx'));
            const producto = productosCache[idx];
            if (!producto) return;
            if (producto.id) {
                window.location.href = `producto.html?id=${producto.id}`;
                return;
            }
            // Guardar ID del producto en el modal para usarlo al agregar al carrito
            const modalEl = document.getElementById('modalDetallesProducto');
            if (modalEl) modalEl.dataset.productId = producto.id || '';

            document.getElementById('detalleImagen').src = safeImageUrl(producto.imagenUrl || producto.imagen || '');
            document.getElementById('detalleNombre').textContent = sanitize(producto.nombre || '');
            document.getElementById('detallePrecio').textContent = calcularPrecioProducto(producto);
            document.getElementById('detalleMarca').textContent = sanitize(producto.marca || '');
            document.getElementById('detalleModelo').textContent = sanitize(producto.modelo || '');
            document.getElementById('detalleCapacidad').textContent = sanitize(producto.capacidad || '');
            document.getElementById('detalleDimension').textContent = producto.dimension || '';
            document.getElementById('detalleCategoria').textContent = sanitize(producto.categoria || '');
            document.getElementById('detalleSubcategoria').textContent = sanitize(producto.subcategoria || '');
            const especificacionesRaw = producto.especificaciones || '';
            const lineas = especificacionesRaw
                .split(/\n|<br>|\/n/g)
                .map(l => l.trim())
                .filter(l => l);

            // Detecta si la mayoría de líneas tienen formato CLAVE: VALOR
            const esTabla = lineas.filter(l => l.includes(':')).length > lineas.length / 2;

            let especificacionesHTML = '';
            if (esTabla) {
                // Mostrar como tabla
                especificacionesHTML = '<table class="table table-sm table-borderless mb-0">';
                especificacionesHTML += lineas.map(l => {
                    const partes = l.split(':');
                    if (partes.length > 1) {
                        return `<tr><th class="fw-normal text-muted" style="width: 40%;">${partes[0].trim()}</th><td>${partes.slice(1).join(':').trim()}</td></tr>`;
                    } else {
                        return `<tr><td colspan="2">${l}</td></tr>`;
                    }
                }).join('');
                especificacionesHTML += '</table>';
            } else {
                // Mostrar como lista
                especificacionesHTML = '<ul style="padding-left: 1.2em;">' +
                    lineas.map(l => `<li>${l}</li>`).join('') +
                    '</ul>';
            }

            document.getElementById('detalleEspecificaciones').innerHTML = especificacionesHTML;
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalDetallesProducto'));
            modal.show();
        });
    });

    // Evento Editar (solo admin)
    document.querySelectorAll('.btn-editar-producto').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const producto = productosCache.find(p => p.id === id);
            if (!producto) return;
            document.getElementById('nombre').value = producto.nombre || '';
            document.getElementById('precioCompra').value = producto.precioCompra || '';
            document.getElementById('precioVenta').value = producto.precio || '';
            document.getElementById('imagen').value = producto.imagen || '';
            document.getElementById('categoria').value = producto.categoria || '';
            document.getElementById('subcategoria').value = producto.subcategoria || '';
            document.getElementById('marca').value = producto.marca || '';
            document.getElementById('capacidad').value = producto.capacidad || '';
            document.getElementById('modelo').value = producto.modelo || '';
            document.getElementById('dimension').value = producto.dimension || '';
            document.getElementById('especificaciones').value = producto.especificaciones || '';
            document.getElementById('monedaCompra').value = producto.moneda || 'USD';
            document.getElementById('adminForm').dataset.editId = producto.id;
            document.getElementById('adminContainer').classList.remove('d-none');
            window.scrollTo({ top: document.getElementById('adminContainer').offsetTop, behavior: 'smooth' });
        });
    });
}

// --- MODIFICA LA CARGA DE PRODUCTOS PARA GUARDAR EL ID ---
function mostrarProductos() {
    const loader = document.getElementById('loaderProductos');
    const container = document.getElementById('productos');
    
    if (loader) loader.style.display = 'block';
    if (container) container.style.display = 'none';

    console.log('Iniciando escucha de productos en Firestore...');

    if (unsubscribe) unsubscribe();
    
    if (typeof db === 'undefined' || !db) {
        console.error('No se pudo iniciar mostrarProductos: db no está definido.');
        if (loader) loader.innerHTML = '<div class="text-danger">Error: Firebase no inicializado.</div>';
        return;
    }

    unsubscribe = db.collection('productos').onSnapshot(snapshot => {
        console.log('Snapshot de productos recibido. Cantidad:', snapshot.size);
        productosCache = [];
        
        if (snapshot.empty) {
            console.warn('La colección "productos" está vacía en Firebase.');
        }

        snapshot.forEach(doc => {
            const prod = doc.data();
            prod.id = doc.id;
            productosCache.push(prod);
        });
        
        window.productosCache = productosCache;
        paginaActual = 1;
        renderProductosPaginados();

        if (loader) loader.style.display = 'none';
        if (container) container.style.display = '';
    }, error => {
        console.error('Error en onSnapshot productos:', error);
        if (loader) {
            loader.innerHTML = `
                <div class="alert alert-danger mx-auto" style="max-width: 500px;">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Error al conectar con Firebase: ${error.message}
                    <br><small>Verifica las reglas de seguridad o la configuración del proyecto.</small>
                </div>`;
        }
    });
}
// --- FUNCIÓN PARA ORDENAR POR CAPACIDAD (asegúrate de que esté antes de renderProductosPaginados) ---
function parseCapacidad(valor) {
    if (!valor) return 0;
    valor = valor.toString().trim().toUpperCase();
    // Extrae número y unidad
    const match = valor.match(/([\d,.]+)\s*(TB|GB|MB|KB)?/i);
    if (!match) return 0;
    let num = parseFloat(match[1].replace(',', '.'));
    let unidad = match[2] || 'GB';
    if (isNaN(num)) return 0;
    switch (unidad) {
        case 'TB': return num * 1024;
        case 'GB': return num;
        case 'MB': return num / 1024;
        case 'KB': return num / (1024 * 1024);
        default: return num;
    }
}

// --- EVENTO PARA ORDENAR ---
const ordenarSelectEl = document.getElementById('ordenarSelect');
if (ordenarSelectEl) {
    ordenarSelectEl.addEventListener('change', function () {
        renderProductosPaginados();
    });
}


// --- REGLA DE SEGURIDAD FIRESTORE (configura en la consola de Firebase) ---
/*
service cloud.firestore {
  match /databases/{database}/documents {
    match /productos/{document} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
*/

// Logout (si existe el botón en la página)
(function () {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            auth.signOut();
        });
    }
})();

// Calcula y muestra el precio de venta automáticamente
// Usa tipoCambioGlobal en vez de llamar a la API cada vez

// Listeners de cálculo de precio (solo en páginas con formulario admin)
(function () {
    const precioCompraInput = document.getElementById('precioCompra');
    const monedaCompraSelect = document.getElementById('monedaCompra');
    if (precioCompraInput) precioCompraInput.addEventListener('input', calcularPrecioVenta);
    if (monedaCompraSelect) monedaCompraSelect.addEventListener('change', calcularPrecioVenta);
})();
function calcularPrecioVenta() {
    const precioCompra = parseFloat(document.getElementById('precioCompra').value);
    const moneda = document.getElementById('monedaCompra').value;
    if (isNaN(precioCompra) || precioCompra <= 0) {
        document.getElementById('precioVenta').value = '';
        return;
    }
    let precioVenta;
    if (moneda === 'USD') {
        precioVenta = precioCompra * tipoCambioGlobal * 1.18 * 1.35;
    } else {
        precioVenta = precioCompra * 1.18 * 1.35;
    }
    precioVenta = Math.ceil(precioVenta);
    document.getElementById('precioVenta').value = precioVenta;
}

const adminFormEl = document.getElementById('adminForm');
if (adminFormEl) adminFormEl.addEventListener('submit', async function (e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const precioCompra = parseFloat(document.getElementById('precioCompra').value);
    const precioVenta = parseFloat(document.getElementById('precioVenta').value);
    const imagen = document.getElementById('imagen').value.trim();
    const categoria = document.getElementById('categoria').value.trim();
    const subcategoria = document.getElementById('subcategoria').value.trim();
    const marca = document.getElementById('marca').value.trim();
    const capacidad = document.getElementById('capacidad').value.trim();
    const modelo = document.getElementById('modelo').value.trim();
    const dimension = document.getElementById('dimension').value.trim();
    const especificaciones = document.getElementById('especificaciones').value.trim();
    const moneda = document.getElementById('monedaCompra').value;
    const editId = this.dataset.editId;
    // Validación básica
    if (!nombre || isNaN(precioCompra) || precioCompra <= 0 || isNaN(precioVenta) || precioVenta <= 0 || !imagen || !categoria || !subcategoria || !marca) {
        alert('Por favor, completa todos los campos obligatorios y asegúrate de que los precios sean válidos.');
        return;
    }
    try {
        if (editId) {
            await db.collection('productos').doc(editId).update({
                nombre, precioCompra, precio: precioVenta, imagen, categoria, subcategoria, marca, capacidad, modelo, dimension, especificaciones, moneda
            });
            delete this.dataset.editId;
        } else {
            await db.collection('productos').add({
                nombre, precioCompra, precio: precioVenta, imagen, categoria, subcategoria, marca, capacidad, modelo, dimension, especificaciones, moneda
            });
        }
        this.reset();
        document.getElementById('precioVenta').value = '';
        document.getElementById('monedaCompra').value = 'USD';
    } catch (err) {
        alert('Error al registrar el producto. Intenta nuevamente.');
    }
});

// Función global para sincronizar sesión y estado del navbar de forma inmediata y resiliente
window.sincronizarEstadoNavbarUsuario = function(userObj) {
    const user = userObj !== undefined ? userObj : (window.currentFirebaseUser || (typeof auth !== 'undefined' && auth && auth.currentUser ? auth.currentUser : null));
    const logoutBtn = document.getElementById('logoutBtnNav');
    const logoutLi = document.getElementById('logoutLi');
    const loginLi = document.getElementById('loginLi');
    const userEmail = document.getElementById('userEmail');
    const userEmailShort = document.getElementById('userEmailShort');
    const userEmailFull = document.getElementById('userEmailFull');
    const adminLinkLi = document.getElementById('adminLinkLi');

    const cachedEmail = localStorage.getItem('edark_user_email_cache');
    const cachedName = localStorage.getItem('edark_user_name_cache');
    const activeEmail = user ? user.email : cachedEmail;
    const activeName = user ? (user.displayName ? user.displayName.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'Usuario')) : cachedName;

    if (user || cachedEmail) {
        if (logoutBtn) logoutBtn.classList.remove('d-none');
        if (logoutLi) logoutLi.classList.remove('d-none');
        if (loginLi) loginLi.classList.add('d-none');
        if (userEmail) { userEmail.textContent = activeEmail || ''; userEmail.classList.add('d-none'); }
        if (userEmailShort) userEmailShort.textContent = activeName || 'Usuario';
        if (userEmailFull) userEmailFull.textContent = activeEmail || 'Usuario Activo';

        const EMAIL_WHITELIST = ['edark.import@gmail.com', 'edark-import@gmail.com', 'edarkimport@gmail.com'].map(e => e.toLowerCase());
        if (activeEmail && EMAIL_WHITELIST.includes(activeEmail.toLowerCase())) {
            if (adminLinkLi) adminLinkLi.classList.remove('d-none');
            window.currentUserIsAdmin = true;
        }
    } else {
        if (logoutBtn) logoutBtn.classList.add('d-none');
        if (logoutLi) logoutLi.classList.add('d-none');
        if (loginLi) loginLi.classList.remove('d-none');
        if (userEmail) { userEmail.textContent = ''; userEmail.classList.add('d-none'); }
        if (userEmailShort) userEmailShort.textContent = 'Ingresar';
        if (userEmailFull) userEmailFull.textContent = 'Invitado';
        if (adminLinkLi) adminLinkLi.classList.add('d-none');
    }
};

// Mostrar/ocultar botones de login/logout, email y panel de administración según rol verificado
const _auth = typeof auth !== 'undefined' && auth ? auth : (window.auth || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null));
if (_auth) {
_auth.onAuthStateChanged(async user => {
    if (user) {
        window.currentFirebaseUser = user;
        try {
            localStorage.setItem('edark_user_email_cache', user.email || '');
            localStorage.setItem('edark_user_name_cache', user.displayName ? user.displayName.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'Usuario'));
        } catch(e) {}
    } else {
        window.currentFirebaseUser = null;
        try {
            localStorage.removeItem('edark_user_email_cache');
            localStorage.removeItem('edark_user_name_cache');
        } catch(e) {}
    }

    window.sincronizarEstadoNavbarUsuario(user);

    if (!user) {
        const adminContainer = document.getElementById('adminContainer');
        if (adminContainer) adminContainer.classList.add('d-none');
        window.currentUserIsAdmin = false;
        renderProductosPaginados();
        return;
    }

    const loginModalEl = document.getElementById('loginModal');
    const loginModal = loginModalEl ? bootstrap.Modal.getInstance(loginModalEl) : null;
    if (loginModal) loginModal.hide();

    let esAdmin = false;
    const EMAIL_WHITELIST = ['edark.import@gmail.com', 'edark-import@gmail.com', 'edarkimport@gmail.com'].map(e => e.toLowerCase());
    if (EMAIL_WHITELIST.includes((user.email || '').toLowerCase())) esAdmin = true;

    try {
        const token = await user.getIdTokenResult();
        const c = token.claims || {};
        if (c.admin === true || c.rol === 'admin' || c.role === 'admin' || c.isAdmin === true) esAdmin = true;
    } catch (e) {}

    if (!esAdmin && typeof db !== 'undefined' && db.collection) {
        try {
            const snap = await db.collection('usuarios').doc(user.uid).get();
            if (snap.exists) {
                const u = snap.data();
                if (u.rol === 'admin' || u.role === 'admin' || u.admin === true || u.isAdmin === true) esAdmin = true;
            }
        } catch (e) {}
        if (!esAdmin && user.email) {
            try {
                const snapEmail = await db.collection('usuarios').where('email', '==', user.email.toLowerCase()).get();
                if (!snapEmail.empty) {
                    const u = snapEmail.docs[0].data();
                    if (u.rol === 'admin' || u.role === 'admin' || u.admin === true || u.isAdmin === true) esAdmin = true;
                }
            } catch (e) {}
        }
    }

    window.currentUserIsAdmin = esAdmin;

    if (esAdmin) {
        if (adminContainer) adminContainer.classList.remove('d-none');
        if (adminLinkLi) adminLinkLi.classList.remove('d-none');
    } else {
        if (adminContainer) adminContainer.classList.add('d-none');
        if (adminLinkLi) adminLinkLi.classList.add('d-none');
    }

    renderProductosPaginados();
});
}

// Handler login modal
// No login form on index: admin login must be used on the admin page only.

// Soporte para submenús en Bootstrap 5
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.dropdown-submenu > a').forEach(function (element) {
        element.addEventListener('mouseenter', function (e) {
            let submenu = element.nextElementSibling;
            if (submenu && submenu.classList.contains('dropdown-menu')) {
                submenu.classList.add('show');
            }
        });
        element.parentElement.addEventListener('mouseleave', function (e) {
            let submenu = element.nextElementSibling;
            if (submenu && submenu.classList.contains('dropdown-menu')) {
                submenu.classList.remove('show');
            }
        });
    });
});

// --- FUNCIÓN PARA FILTRAR PRODUCTOS SEGÚN LOS FILTROS SELECCIONADOS ---
function productoCoincideFiltros(producto) {
    // Ocultar productos inactivos
    if (producto.activo === false) {
        return false;
    }
    // Filtros por campos con lógica anidada
    for (const campo of Object.keys(filtrosSeleccionados)) {
        const valores = filtrosSeleccionados[campo];
        if (valores && valores.length > 0) {
            if (campo === 'subcategoria') {
                // La subcategoría solo se aplica si su categoría padre está seleccionada o no hay categorías seleccionadas
                const categoriasSeleccionadas = filtrosSeleccionados['categoria'] || [];

                if (categoriasSeleccionadas.length > 0) {
                    // Si hay categorías seleccionadas, verificar que:
                    // 1. La categoría del producto esté en las seleccionadas
                    // 2. La subcategoría del producto esté en las seleccionadas
                    if (!categoriasSeleccionadas.includes(producto.categoria)) {
                        return false;
                    }
                    if (!valores.includes(producto.subcategoria)) {
                        return false;
                    }
                } else {
                    // Si no hay categorías seleccionadas, solo filtrar por subcategoría
                    if (!valores.includes(producto.subcategoria)) {
                        return false;
                    }
                }
            } else if (campo === 'categoria') {
                if (!valores.includes(producto.categoria)) {
                    return false;
                }
            } else {
                // Para otros campos, verificar que el producto tenga el valor
                const productoValor = producto[campo] || '';
                if (!valores.includes(productoValor)) {
                    return false;
                }
            }
        }
    }
    // Filtro de precio
    // Filtro de precio usando precio calculado
    const precioCalc = parseFloat(calcularPrecioProducto(producto));
    if (!isNaN(precioCalc)) {
        if (precioCalc < precioFiltroMin || precioCalc > precioFiltroMax) {
            return false;
        }
    }
    // Filtro de búsqueda
    if (textoBusqueda) {
        const texto = (
            (producto.nombre || '') + ' ' +
            (producto.categoria || '') + ' ' +
            (producto.subcategoria || '') + ' ' +
            (producto.marca || '') + ' ' +
            (producto.capacidad || '') + ' ' +
            (producto.modelo || '') + ' ' +
            (producto.dimension || '') + ' ' +
            (producto.especificaciones || '')
        ).toLowerCase();
        if (!texto.includes(textoBusqueda)) {
            return false;
        }
    }
    return true;
}

// --- EVENTO DE BÚSQUEDA PREDICTIVA EN VIVO ---
// (Gestionado globalmente por inicializarBusquedaPredictiva y sincronizado con renderProductosPaginados)

// (Se eliminó una redefinición duplicada de asignarEventosProductos que sobrescribía el precio mostrado)

// --- CARRITO DE COMPRAS ---
var carrito = window.carrito || JSON.parse(localStorage.getItem('carrito')) || [];

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    const count = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = count;
    const btn = document.getElementById('cartBtn');
    if (btn && count > 0) {
        btn.classList.add('cart-bounce');
        setTimeout(() => btn.classList.remove('cart-bounce'), 600);
    }
}

function renderCarrito() {
    // Soportar tanto el contenedor en Offcanvas como en página/modal
    const cont = document.getElementById('carritoContenido');
    if (!cont) return;

    if (carrito.length === 0) {
        cont.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-cart-x fs-1 text-muted opacity-50 d-block mb-3"></i>
                <h6 class="text-muted fw-bold">Tu carrito está vacío</h6>
                <p class="small text-secondary mb-3">Agrega algunos productos tecnológicos de nuestro catálogo para comenzar.</p>
                <a href="index.html" class="btn btn-sm btn-primary px-3">Explorar Tienda</a>
            </div>`;
        const totalDisp = document.getElementById('carritoTotalDisplay');
        if (totalDisp) totalDisp.textContent = 'S/ 0.00';
        return;
    }

    const totalSoles = carrito.reduce((acc, item) => acc + Number(item.precio) * Number(item.cantidad), 0);
    const faltaEnvio = 250 - totalSoles;

    let html = '';
    if (faltaEnvio > 0) {
        const porcentaje = Math.min(100, Math.round((totalSoles / 250) * 100));
        html += `
            <div class="bg-light p-2 rounded-3 border mb-3 small">
                <div class="d-flex justify-content-between mb-1">
                    <span>Envío GRATIS en Lima:</span>
                    <strong class="text-primary">Te faltan S/ ${faltaEnvio.toFixed(2)}</strong>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${porcentaje}%"></div>
                </div>
            </div>`;
    } else {
        html += `
            <div class="alert alert-success py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                <i class="bi bi-check-circle-fill text-success fs-5"></i>
                <div>¡Felicidades! Tienes <strong>Envío GRATIS</strong> en Lima Metropolitana. 🎉</div>
            </div>`;
    }

    html += '<div class="d-flex flex-column gap-2 mb-3">';
    carrito.forEach((item, idx) => {
        html += `
            <div class="cart-item-card p-2 rounded-3 border bg-white d-flex align-items-center gap-3 shadow-sm">
                <img src="${safeImageUrl(item.imagen)}" alt="${sanitize(item.nombre)}" loading="lazy" decoding="async" class="rounded-2 flex-shrink-0" style="width: 60px; height: 60px; object-fit: contain; background: #f8f9fa; padding: 2px;">
                <div class="flex-grow-1 min-w-0">
                    <h6 class="mb-1 text-truncate fw-bold text-dark" style="font-size: 0.9rem;" title="${sanitize(item.nombre)}">${sanitize(item.nombre)}</h6>
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <span class="text-primary fw-bold small">S/ ${Number(item.precio).toFixed(2)}</span>
                        <div class="input-group input-group-sm" style="width: 90px;">
                            <button class="btn btn-outline-secondary btn-restar-cantidad px-2" type="button" data-idx="${idx}">-</button>
                            <input type="text" class="form-control text-center px-0 bg-light fw-bold" value="${item.cantidad}" readonly style="font-size:0.85rem;">
                            <button class="btn btn-outline-secondary btn-sumar-cantidad px-2" type="button" data-idx="${idx}">+</button>
                        </div>
                    </div>
                </div>
                <button class="btn btn-link text-danger p-1 btn-eliminar flex-shrink-0" title="Eliminar producto" data-idx="${idx}">
                    <i class="bi bi-trash3 fs-6"></i>
                </button>
            </div>`;
    });
    html += '</div>';

    cont.innerHTML = html;

    const totalDisp = document.getElementById('carritoTotalDisplay');
    if (totalDisp) totalDisp.textContent = `S/ ${totalSoles.toFixed(2)}`;

    // Eventos para sumar/restar/eliminar
    cont.querySelectorAll('.btn-sumar-cantidad').forEach(btn => {
        btn.addEventListener('click', function () {
            const idx = parseInt(this.dataset.idx);
            if (carrito[idx]) {
                carrito[idx].cantidad++;
                guardarCarrito();
                renderCarrito();
            }
        });
    });

    cont.querySelectorAll('.btn-restar-cantidad').forEach(btn => {
        btn.addEventListener('click', function () {
            const idx = parseInt(this.dataset.idx);
            if (carrito[idx]) {
                if (carrito[idx].cantidad > 1) {
                    carrito[idx].cantidad--;
                } else {
                    carrito.splice(idx, 1);
                }
                guardarCarrito();
                renderCarrito();
            }
        });
    });

    cont.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', function () {
            const idx = parseInt(this.dataset.idx);
            if (carrito[idx]) {
                carrito.splice(idx, 1);
                guardarCarrito();
                renderCarrito();
            }
        });
    });
}

// Guardar historial de pedido local y en la nube
function guardarHistorialPedido(ventaData) {
    let historial = JSON.parse(localStorage.getItem('historialPedidos')) || [];
    const idPedido = 'ED-' + Math.floor(100000 + Math.random() * 900000);
    const fechaStr = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const userEm = (typeof auth !== 'undefined' && auth.currentUser && auth.currentUser.email)
        ? auth.currentUser.email
        : (localStorage.getItem('userEmail') || ventaData.paypalEmail || 'Cliente Invitado');

    const nuevoPedido = {
        id: idPedido,
        fecha: fechaStr,
        timestamp: Date.now(),
        productos: ventaData.productos || [],
        total: Number(ventaData.total) || 0,
        metodoPago: ventaData.metodoPago || 'WhatsApp',
        estado: 'En Proceso',
        usuarioEmail: userEm
    };

    historial.unshift(nuevoPedido);
    localStorage.setItem('historialPedidos', JSON.stringify(historial));

    // Si Firestore está activo, intentar guardar también en colección 'ventas'
    if (typeof db !== 'undefined' && db.collection) {
        db.collection('ventas').add({
            ...nuevoPedido,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => console.log('Pedido registrado en Firestore exitosamente.'))
        .catch(err => console.warn('Aviso al guardar en Firestore:', err));
    }
    return nuevoPedido;
}
window.guardarHistorialPedido = guardarHistorialPedido;

function procesarPedidoWhatsApp() {
    if (carrito.length === 0) return;
    const totalSoles = carrito.reduce((acc, item) => acc + Number(item.precio) * Number(item.cantidad), 0);

    const pedido = guardarHistorialPedido({
        productos: carrito.map(item => ({
            id: item.id || null,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad,
            subtotal: item.precio * item.cantidad,
            imagen: item.imagen || ''
        })),
        total: totalSoles,
        metodoPago: 'WhatsApp'
    });

    let mensaje = `¡Hola eDark Import! 🐉 Quiero realizar el pedido *#${pedido.id}* con lo siguiente:%0A%0A`;
    carrito.forEach(item => {
        mensaje += `• *${item.nombre}*%0A  Cantidad: ${item.cantidad} x S/ ${Number(item.precio).toFixed(2)} = S/ ${(Number(item.precio) * Number(item.cantidad)).toFixed(2)}%0A`;
    });
    mensaje += `%0A*TOTAL A PAGAR: S/ ${totalSoles.toFixed(2)}*%0A`;
    mensaje += `Método de envío/pago a coordinar. ¡Quedo atento!`;

    window.open(`https://wa.me/${typeof phone !== 'undefined' ? phone : '51999999999'}?text=${mensaje}`, '_blank');

    setTimeout(() => {
        if (confirm('¿Tu pedido se abrió en WhatsApp correctamente? Presiona Aceptar para vaciar el carrito y guardar en tu historial.')) {
            carrito = [];
            guardarCarrito();
            renderCarrito();
        }
    }, 1200);
}

function abrirCarritoOffcanvas() {
    let offcanvasEl = document.getElementById('offcanvasCarrito');
    if (!offcanvasEl) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="offcanvas offcanvas-end shadow-lg border-0" tabindex="-1" id="offcanvasCarrito" aria-labelledby="offcanvasCarritoLabel" style="width: 420px; z-index: 1060;">
                <div class="offcanvas-header bg-primary text-white py-3 shadow-sm">
                    <h5 class="offcanvas-title fw-bold d-flex align-items-center gap-2 mb-0" id="offcanvasCarritoLabel">
                        <i class="bi bi-cart3"></i> Mi Carrito de Compras
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
                </div>
                <div class="offcanvas-body p-3 d-flex flex-column" id="offcanvasBodyContainer">
                    <div id="carritoContenido" class="flex-grow-1 overflow-auto pe-1"></div>
                    <div class="border-top pt-3 mt-auto bg-white" id="offcanvasFooter">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="text-muted fw-semibold">Total a pagar:</span>
                            <span class="fs-4 fw-bold text-primary" id="carritoTotalDisplay">S/ 0.00</span>
                        </div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-success fw-bold d-flex align-items-center justify-content-center gap-2 py-2 shadow-sm" id="btnEnviarWhatsappOffcanvas">
                                <i class="bi bi-whatsapp fs-5"></i> Pedir por WhatsApp
                            </button>
                            <div id="paypal-button-container" class="mt-1"></div>
                            <div class="d-flex gap-2 mt-1">
                                <a href="carrito.html" class="btn btn-outline-primary btn-sm flex-grow-1 fw-bold">Ver Carrito Completo</a>
                                <button class="btn btn-outline-danger btn-sm" id="btnVaciarCarritoOffcanvas" title="Vaciar carrito"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(div);
        offcanvasEl = document.getElementById('offcanvasCarrito');

        const btnVaciar = document.getElementById('btnVaciarCarritoOffcanvas');
        if (btnVaciar) {
            btnVaciar.addEventListener('click', function () {
                if (carrito.length > 0 && confirm('¿Estás seguro de vaciar todo tu carrito?')) {
                    carrito = [];
                    guardarCarrito();
                    renderCarrito();
                }
            });
        }
        const btnWhatsapp = document.getElementById('btnEnviarWhatsappOffcanvas');
        if (btnWhatsapp) {
            btnWhatsapp.addEventListener('click', function () {
                procesarPedidoWhatsApp();
            });
        }
    }

    renderCarrito();
    const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl) || new bootstrap.Offcanvas(offcanvasEl);
    offcanvas.show();

    if (!paypalButtonsRendered) {
        initPayPalButton();
        paypalButtonsRendered = true;
    }
}
window.abrirCarritoOffcanvas = abrirCarritoOffcanvas;

// --- INTERACCIÓN CON EL CARRITO Y EL NAVBAR (DELEGACIÓN DE EVENTOS) ---
let paypalButtonsRendered = false;

document.addEventListener('click', function (e) {
    // 1. Botón de Carrito (Navbar)
    const cartBtn = e.target.closest('#cartBtn');
    if (cartBtn) {
        abrirCarritoOffcanvas();
        return;
    }

    // 2. Botón Cerrar Sesión en Navbar
    const logoutBtn = e.target.closest('#logoutBtnNav');
    if (logoutBtn) {
        if (typeof auth !== 'undefined') {
            auth.signOut().then(() => {
                window.location.reload();
            });
        }
        return;
    }
});

// Registrar eventos del modalCarrito si está presente
document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('modalCarrito');
    if (modalEl) {
        modalEl.addEventListener('hidden.bs.modal', function () {
            const cont = document.querySelector('#paypal-button-container');
            if (cont) cont.innerHTML = '';
            paypalButtonsRendered = false;
        });
    }
});

// Listener Vaciar Carrito (Seguro)
document.addEventListener('DOMContentLoaded', () => {
    const btnVaciar = document.getElementById('btnVaciarCarrito');
    if (btnVaciar) {
        btnVaciar.addEventListener('click', function () {
            carrito = [];
            guardarCarrito();
            renderCarrito();
        });
    }

    // Listener Enviar WhatsApp (Seguro)
    const btnWhatsapp = document.getElementById('btnEnviarWhatsapp');
    if (btnWhatsapp) {
        btnWhatsapp.addEventListener('click', function () {
            if (carrito.length === 0) return;
            let mensaje = '¡Hola! Quiero pedir lo siguiente:%0A';
            carrito.forEach(item => {
                mensaje += `• ${item.nombre} %0A(S/ ${item.precio} x ${item.cantidad} UND)%0A`;
            });
            mensaje += `%0ATotal: S/ ${carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)}`;
            window.open(`https://wa.me/${phone}?text=${mensaje}`, '_blank');
        });
    }
});

// --- PAYPAL PAYMENT INTEGRATION ---
function calcularTotalCarritoSoles() {
    return carrito.reduce((acc, item) => acc + Number(item.precio) * Number(item.cantidad), 0);
}

function initPayPalButton() {
    if (typeof paypal === 'undefined') {
        console.warn('PayPal SDK no cargado');
        return;
    }

    const containerSelector = '#paypal-button-container';
    const cont = document.querySelector(containerSelector);
    if (cont) cont.innerHTML = '';

    paypal.Buttons({
        createOrder: function (data, actions) {
            if (carrito.length === 0) {
                alert('El carrito está vacío');
                return;
            }
            // Convertir total en soles (S/) a dólares (USD) para evitar error de divisa no soportada en PayPal local
            const totalSoles = calcularTotalCarritoSoles();
            const totalUSD = totalSoles / tipoCambioGlobal;

            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: totalUSD.toFixed(2),
                        currency_code: 'USD'
                    },
                    description: `Compra en eDark - ${carrito.length} producto(s) (S/ ${totalSoles.toFixed(2)} convertidos a USD)`
                }]
            });
        },
        onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
                // Pago exitoso
                alert(`¡Pago exitoso! Gracias por tu compra, ${details.payer.name.given_name}.`);

                // Guardar la venta en Firestore
                guardarVentaPayPal(details);

                // Limpiar carrito
                carrito = [];
                guardarCarrito();
                renderCarrito();

                // Cerrar modal
                const modalEl = document.getElementById('modalCarrito');
                const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
                if (modal) modal.hide();
            });
        },
        onError: function (err) {
            console.error('Error en PayPal:', err);
            alert('Hubo un error procesando el pago. Por favor intenta de nuevo.');
        }
    }).render(containerSelector);
}

function guardarVentaPayPal(details) {
    const totalSoles = calcularTotalCarritoSoles();
    const venta = {
        productos: carrito.map(item => ({
            id: item.id || null,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad,
            subtotal: item.precio * item.cantidad
        })),
        total: totalSoles,
        metodoPago: 'PayPal',
        paypalOrderId: details.id,
        paypalPayerId: details.payer.payer_id,
        paypalEmail: details.payer.email_address,
        estado: 'completado',
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('ventas').add(venta)
        .then(() => console.log('Venta guardada en Firestore'))
        .catch(error => console.error('Error guardando venta:', error));
}

// === CARGA DINÁMICA DE SDK PAYPAL DESDE CONFIG (Firestore: config/general) ===
let paypalScriptEstado = 'no-cargado';
// Fallback público (client id de PayPal, no es secreto). Usa el tuyo si config/general no está disponible.
const PAYPAL_CLIENT_ID_FALLBACK = 'AQfZy0lnnXz1a9EfXJ588is9ZeAADGiFGp3nxrg-wAbdEqG-mykhKDkrP8wlDfmpVw3VLgaJtPIM7NBo';
async function cargarPayPalDesdeConfig() {
    if (paypalScriptEstado === 'cargando' || paypalScriptEstado === 'cargado') return;
    try {
        const snap = await db.collection('config').doc('general').get();
        const cfg = snap.exists ? snap.data() : {};
        const clientId = (cfg && cfg.paypalClientId) ? cfg.paypalClientId : PAYPAL_CLIENT_ID_FALLBACK;
        if (!clientId) {
            console.warn('Sin clientId PayPal. No se cargará el SDK.');
            return;
        }
        paypalScriptEstado = 'cargando';
        const s = document.createElement('script');
        s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD`;
        s.onload = () => { paypalScriptEstado = 'cargado'; console.log('PayPal SDK cargado'); };
        s.onerror = () => { paypalScriptEstado = 'error'; console.error('Error cargando PayPal SDK'); };
        document.head.appendChild(s);
    } catch (e) {
        console.warn('No se pudo cargar configuración PayPal, usando fallback:', e.message);
        if (paypalScriptEstado === 'no-cargado' && PAYPAL_CLIENT_ID_FALLBACK) {
            try {
                paypalScriptEstado = 'cargando';
                const s = document.createElement('script');
                s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID_FALLBACK)}&currency=USD`;
                s.onload = () => { paypalScriptEstado = 'cargado'; console.log('PayPal SDK (fallback) cargado'); };
                s.onerror = () => { paypalScriptEstado = 'error'; console.error('Error cargando PayPal SDK (fallback)'); };
                document.head.appendChild(s);
            } catch (err) {
                console.error('Fallo al cargar SDK PayPal con fallback:', err);
            }
        }
    }
}
// Intentar cargar el SDK al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarPayPalDesdeConfig();
    // Fallback: asegurar que el botón de cierre funcione en ambos modales
    const detalleModal = document.getElementById('modalDetallesProducto');
    const carritoModal = document.getElementById('modalCarrito');
    [detalleModal, carritoModal].forEach(modal => {
        if (!modal) return;
        modal.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const inst = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
                inst.hide();
            });
        });
    });
});

// --- FUNCIÓN PARA AGREGAR DESDE TARJETA DE PRODUCTO ---
function agregarAlCarritoDesdeCard(id, event) {
    if (event && event.stopPropagation) event.stopPropagation();
    if (event && event.preventDefault) event.preventDefault();
    const producto = productosCache.find(p => p.id === id);
    if (!producto) return;
    const productToAdd = {
        id: producto.id,
        nombre: producto.nombre,
        precio: parseFloat(calcularPrecioProducto(producto)),
        imagen: producto.imagenUrl || producto.imagen || ''
    };
    agregarAlCarrito(productToAdd, 1);
    mostrarToastCarrito(`¡${sanitize(producto.nombre)} agregado al carrito!`);
}
window.agregarAlCarritoDesdeCard = agregarAlCarritoDesdeCard;

function mostrarToastCarrito(mensaje) {
    const toastHtml = `<div class="toast align-items-center text-white bg-primary border-0 position-fixed top-0 end-0 m-3 shadow-lg rounded-3 overflow-hidden" style="z-index:9999" role="alert">
        <div class="d-flex align-items-center p-1">
            <div class="toast-body fw-bold d-flex align-items-center gap-2">
                <i class="bi bi-cart-check-fill fs-5 text-warning"></i> 
                <span>${mensaje}</span>
            </div>
            <button type="button" class="btn btn-sm btn-light text-primary fw-bold ms-auto me-2 px-2 py-1 shadow-sm flex-shrink-0" onclick="abrirCarritoOffcanvas(); const t = bootstrap.Toast.getInstance(this.closest('.toast')); if(t) t.hide();" style="font-size: 0.8rem; border-radius: 6px;">Ver Carrito <i class="bi bi-arrow-right"></i></button>
            <button type="button" class="btn-close btn-close-white me-2 m-auto flex-shrink-0" data-bs-dismiss="toast"></button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.body.lastElementChild;
    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}
window.mostrarToastCarrito = mostrarToastCarrito;

// --- FUNCIÓN GLOBAL PARA AGREGAR AL CARRITO ---
function agregarAlCarrito(producto, cantidad = 1) {
    try {
        if (!producto || !producto.nombre) return;
        const precio = parseFloat(producto.precio) || parseFloat(producto.precioVenta) || parseFloat(producto.precioFinal) || 0;
        if (isNaN(precio) || precio <= 0) return;

        let idx = -1;
        if (producto.id) {
            idx = carrito.findIndex(item => item.id === producto.id);
        }
        if (idx < 0) {
            idx = carrito.findIndex(item => item.nombre === producto.nombre && Math.abs(Number(item.precio) - precio) < 0.01);
        }

        const imagenUrl = producto.imagenUrl || producto.imagen || '';

        if (idx >= 0) {
            carrito[idx].cantidad += cantidad;
        } else {
            carrito.push({
                id: producto.id || undefined,
                nombre: producto.nombre,
                precio: precio,
                imagen: imagenUrl,
                cantidad: cantidad
            });
        }

        guardarCarrito();
        actualizarContadorCarrito();
        console.log(`[Cart] Agregado: ${producto.nombre} x ${cantidad}`);
    } catch (err) {
        console.error('[Cart] Error al agregar producto:', err);
    }
}
window.agregarAlCarrito = agregarAlCarrito;

// --- AGREGAR AL CARRITO DESDE EL MODAL ---
document.addEventListener('DOMContentLoaded', function () {
    const btnAgregar = document.getElementById('btnAgregarAlCarritoModal');
    if (!btnAgregar) return;

    btnAgregar.addEventListener('click', function () {
        try {
            const modalEl = document.getElementById('modalDetallesProducto');
            const productId = modalEl ? modalEl.dataset.productId : '';
            const nombre = document.getElementById('detalleNombre').textContent;
            const precioTexto = document.getElementById('detallePrecio').textContent;
            const imagenSrc = document.getElementById('detalleImagen').src;

            let producto = null;
            if (productId) producto = productosCache.find(p => p.id === productId);
            if (!producto) producto = productosCache.find(p => sanitize(p.nombre || '') === nombre);

            let precioCalc = producto ? parseFloat(calcularPrecioProducto(producto)) : parseFloat(precioTexto);
            if (!nombre || isNaN(precioCalc) || precioCalc <= 0) return;

            const productToAdd = {
                id: productId || (producto ? producto.id : undefined),
                nombre: nombre,
                precio: precioCalc,
                imagen: (producto && (producto.imagenUrl || producto.imagen)) || imagenSrc || ''
            };

            agregarAlCarrito(productToAdd, 1);

            const toastHtml = `<div class="toast align-items-center text-white bg-success border-0 position-fixed top-0 start-50 translate-middle-x mt-3" style="z-index:9999" role="alert">
                <div class="d-flex"><div class="toast-body">✓ Producto agregado al carrito</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            const toastEl = document.body.lastElementChild;
            const toast = new bootstrap.Toast(toastEl, { delay: 2000 });
            toast.show();
            toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());

            const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetallesProducto'));
            if (modal) modal.hide();
        } catch (err) {
            console.error('[Cart] Error adding item to cart:', err);
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    actualizarContadorCarrito();
});
// --- CARRUSEL DINÁMICO ---
document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.getElementById('serviciosCarrusel');
    if (carousel) {
        const carouselInstance = new bootstrap.Carousel(carousel, {
            interval: 5000, // Cambia cada 5 segundos
            pause: 'hover', // Pausa al pasar el mouse
            wrap: true, // Ciclo infinito
            keyboard: true // Navegación con teclado
        });

        // Agregar indicadores dinámicos
        const indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'carousel-indicators';
        carousel.appendChild(indicatorsContainer);

        const items = carousel.querySelectorAll('.carousel-item');
        items.forEach((item, index) => {
            const indicator = document.createElement('button');
            indicator.type = 'button';
            indicator.setAttribute('data-bs-target', '#serviciosCarrusel');
            indicator.setAttribute('data-bs-slide-to', index);
            if (index === 0) indicator.classList.add('active');
            indicator.setAttribute('aria-label', `Slide ${index + 1}`);
            indicatorsContainer.appendChild(indicator);
        });

        // Efectos de entrada para las tarjetas
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const cards = entry.target.querySelectorAll('.card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('fade-in-up');
                        }, index * 100);
                    });
                }
            });
        }, observerOptions);

        items.forEach(item => observer.observe(item));

        // Efectos de hover mejorados
        const cards = carousel.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-10px) scale(1.02)';
                this.style.boxShadow = '0 15px 35px rgba(0, 123, 255, 0.3)';
            });

            card.addEventListener('mouseleave', function () {
                this.style.transform = '';
                this.style.boxShadow = '';
            });
        });

        // Auto-pause cuando no está visible
        const carouselObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    carouselInstance.cycle();
                } else {
                    carouselInstance.pause();
                }
            });
        }, { threshold: 0.5 });

        carouselObserver.observe(carousel);
    }
});

// =========================================================
// MOTOR DE BÚSQUEDA PREDICTIVA EN VIVO (LIVE PREDICTIVE SEARCH)
// =========================================================
function inicializarBusquedaPredictiva() {
    const inputs = document.querySelectorAll('.live-search-input, #buscadorProductos, #navLiveSearchInput');
    if (inputs.length === 0) return;

    async function garantizarCacheProductos() {
        if (window.productosCache && window.productosCache.length > 0) return window.productosCache;
        if (typeof productosCache !== 'undefined' && Array.isArray(productosCache) && productosCache.length > 0) {
            window.productosCache = productosCache;
            return window.productosCache;
        }
        if (!typeof firebase !== 'undefined' && firebase && firebase.firestore) {
            try {
                const snap = await firebase.firestore().collection('productos').where('activo', '==', true).get();
                if (!window.productosCache) window.productosCache = [];
                snap.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    if (!window.productosCache.some(p => p.id === doc.id)) {
                        window.productosCache.push(data);
                    }
                });
                return window.productosCache;
            } catch (e) {
                console.warn('Error cargando caché para búsqueda predictiva:', e);
                return window.productosCache || [];
            }
        }
        return window.productosCache || [];
    }

    inputs.forEach(input => {
        if (input.dataset.liveSearchBound === 'true') return;
        input.dataset.liveSearchBound = 'true';

        let dropdown = input.id === 'buscadorProductos'
            ? document.getElementById('homeLiveSearchDropdown')
            : (input.id === 'navLiveSearchInput'
                ? document.getElementById('navLiveSearchDropdown')
                : input.parentElement.querySelector('.live-search-dropdown'));

        if (!dropdown && input.parentElement) {
            dropdown = input.parentElement.querySelector('.live-search-dropdown');
        }
        if (!dropdown) return;

        let activeIndex = -1;

        input.addEventListener('input', async function () {
            const query = this.value.trim().toLowerCase();

            if (this.id === 'buscadorProductos') {
                window.textoBusqueda = query;
                if (typeof renderProductosPaginados === 'function') renderProductosPaginados();
            }

            if (query.length < 2) {
                dropdown.classList.add('d-none');
                dropdown.innerHTML = '';
                activeIndex = -1;
                return;
            }

            const lista = await garantizarCacheProductos();
            const resultados = lista.filter(p => {
                const nom = (p.nombre || '').toLowerCase();
                const mar = (p.marca || '').toLowerCase();
                const mod = (p.modelo || '').toLowerCase();
                const cat = (p.categoria || '').toLowerCase();
                const sub = (p.subcategoria || '').toLowerCase();
                const cap = (p.capacidad || '').toLowerCase();
                return nom.includes(query) || mar.includes(query) || mod.includes(query) || cat.includes(query) || sub.includes(query) || cap.includes(query);
            }).slice(0, 6);

            if (resultados.length === 0) {
                dropdown.innerHTML = `
                    <div class="p-3 text-center text-muted small">
                        <i class="bi bi-search me-1"></i>No encontramos resultados para "<strong>${sanitize(this.value)}</strong>"
                    </div>`;
                dropdown.classList.remove('d-none');
                activeIndex = -1;
                return;
            }

            let html = '';
            resultados.forEach((prod, idx) => {
                let precio = parseFloat(prod.precioVenta);
                if (window.calcularPrecioProducto) precio = window.calcularPrecioProducto(prod);
                if (!precio || isNaN(precio)) precio = parseFloat(prod.precio) || 0;

                const imgSrc = safeImageUrl(prod.imagenUrl || prod.imagen || 'img/productos/default.png');
                html += `
                    <a href="producto.html?id=${prod.id}" class="live-search-item d-flex align-items-center justify-content-between p-2 border-bottom text-decoration-none transition-all" data-index="${idx}" style="color: inherit;">
                        <div class="d-flex align-items-center gap-2 overflow-hidden">
                            <img src="${imgSrc}" class="rounded shadow-sm" alt="${sanitize(prod.nombre)}" style="width: 42px; height: 42px; object-fit: cover;" loading="lazy" decoding="async" onerror="this.src='img/productos/default.png'">
                            <div class="overflow-hidden">
                                <div class="fw-bold text-truncate text-dark" style="font-size: 0.9rem;">${sanitize(prod.nombre)}</div>
                                <div class="text-muted text-truncate" style="font-size: 0.75rem;">${sanitize(prod.marca || 'eDark')} • ${sanitize(prod.capacidad || prod.categoria || '')}</div>
                            </div>
                        </div>
                        <div class="fw-bold text-primary flex-shrink-0 ms-2" style="font-size: 0.95rem;">S/ ${precio.toFixed(2)}</div>
                    </a>`;
            });

            dropdown.innerHTML = html;
            dropdown.classList.remove('d-none');
            activeIndex = -1;
        });

        input.addEventListener('keydown', function (e) {
            const items = dropdown.querySelectorAll('.live-search-item');
            if (e.key === 'ArrowDown' && !dropdown.classList.contains('d-none')) {
                e.preventDefault();
                activeIndex = (activeIndex + 1) % items.length;
                items.forEach((it, i) => {
                    it.style.backgroundColor = i === activeIndex ? '#f0f4ff' : 'transparent';
                });
                if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp' && !dropdown.classList.contains('d-none')) {
                e.preventDefault();
                activeIndex = (activeIndex - 1 + items.length) % items.length;
                items.forEach((it, i) => {
                    it.style.backgroundColor = i === activeIndex ? '#f0f4ff' : 'transparent';
                });
                if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                if (activeIndex >= 0 && items[activeIndex]) {
                    e.preventDefault();
                    items[activeIndex].click();
                } else {
                    // Si presionan Enter sin elegir un ítem del dropdown, realizar búsqueda en catálogo
                    e.preventDefault();
                    dropdown.classList.add('d-none');
                    const q = input.value.trim();
                    if (!q) return;
                    if (input.id === 'buscadorProductos' || document.getElementById('productos')) {
                        window.textoBusqueda = q.toLowerCase();
                        if (typeof renderProductosPaginados === 'function') renderProductosPaginados();
                        const prodContainer = document.getElementById('productos');
                        if (prodContainer) prodContainer.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        // Navegar al index con parámetro de búsqueda
                        window.location.href = `index.html?buscar=${encodeURIComponent(q)}`;
                    }
                }
            } else if (e.key === 'Escape') {
                dropdown.classList.add('d-none');
            }
        });

        document.addEventListener('click', function (e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('d-none');
            }
        });

        input.addEventListener('focus', function () {
            if (this.value.trim().length >= 2 && dropdown.innerHTML !== '') {
                dropdown.classList.remove('d-none');
            }
        });
    });
}

// =========================================================
// ASISTENTE VIRTUAL CHIMUELO IA (CHATBOT UNIFICADO)
// =========================================================
function inicializarChimueloIA() {
    // 1. Verificar si estamos en la página de mis-pedidos con el widget especializado #ai-chimuelo-toggle
    const toggleWidget = document.getElementById('ai-chimuelo-toggle');
    const panelWidget = document.getElementById('ai-chimuelo-panel');
    const closeWidget = document.getElementById('ai-chimuelo-close');
    const formWidget = document.getElementById('ai-chimuelo-form');
    const inputWidget = document.getElementById('ai-chimuelo-input');
    const messagesWidget = document.getElementById('ai-chimuelo-messages');

    if (toggleWidget && panelWidget) {
        if (!toggleWidget.dataset.bound) {
            toggleWidget.dataset.bound = 'true';
            toggleWidget.addEventListener('click', () => {
                panelWidget.classList.toggle('d-none');
                if (!panelWidget.classList.contains('d-none')) {
                    if (messagesWidget && messagesWidget.children.length === 0) {
                        mostrarBienvenidaChimuelo(messagesWidget, false);
                    }
                    if (inputWidget) setTimeout(() => inputWidget.focus(), 200);
                }
            });
        }
        if (closeWidget && !closeWidget.dataset.bound) {
            closeWidget.dataset.bound = 'true';
            closeWidget.addEventListener('click', () => panelWidget.classList.add('d-none'));
        }
        if (formWidget && !formWidget.dataset.bound) {
            formWidget.dataset.bound = 'true';
            formWidget.addEventListener('submit', (e) => {
                e.preventDefault();
                if (inputWidget && inputWidget.value.trim()) {
                    procesarConsultaChimuelo(inputWidget.value.trim(), messagesWidget, inputWidget);
                }
            });
        }
    }

    // 2. Verificar o inyectar widget flotante general #chatbotBtn / #chatbotModal en el resto del sitio
    let btn = document.getElementById('chatbotBtn');
    let modalEl = document.getElementById('chatbotModal');

    if (!btn && !modalEl && !toggleWidget) {
        const divContainer = document.createElement('div');
        divContainer.innerHTML = `
            <button id="chatbotBtn" style="position:fixed;bottom:30px;right:30px;z-index:1050;"
                class="btn btn-primary rounded-circle shadow-lg p-0 transition-all" aria-label="Abrir chat virtual Chimuelo IA" title="Asistente virtual Chimuelo IA">
                <img src="img/Logo/isotipo_Negro.png" alt="Icono de Chimuelo IA" style="width: 50px; height: auto;">
            </button>
            <div class="modal fade" id="chatbotModal" tabindex="-1" aria-labelledby="chatbotModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-bottom modal-sm" style="position:fixed;bottom:0;right:30px;max-width:360px;margin:0;z-index:1060;">
                    <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden" style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px);">
                        <div class="modal-header py-2.5 bg-primary text-white border-0">
                            <div class="d-flex align-items-center gap-2">
                                <div class="bg-white rounded-circle p-1 d-flex align-items-center justify-content-center shadow-sm" style="width: 32px; height: 32px;">
                                    <img src="img/Logo/isotipo_Negro.png" alt="Chimuelo" style="width: 24px; height: 24px;">
                                </div>
                                <div>
                                    <h6 class="modal-title mb-0 fw-bold" id="chatbotModalLabel" style="font-size: 0.95rem;">Chimuelo IA</h6>
                                    <small class="text-light opacity-75" style="font-size: 0.72rem;">Asistente eDark Import</small>
                                </div>
                            </div>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body p-3" id="chatbotMessages" style="max-height:360px;min-height:280px;overflow-y:auto;font-size:0.93em;display:flex;flex-direction:column;gap:10px;">
                        </div>
                        <div class="modal-footer py-2 bg-light border-top">
                            <div class="input-group input-group-sm">
                                <input type="text" id="chatbotInput" class="form-control rounded-pill ps-3 shadow-none" placeholder="Pregunta sobre productos, pedidos..." autocomplete="off">
                                <button id="chatbotSend" class="btn btn-primary rounded-circle ms-1 px-2.5"><i class="bi bi-send-fill"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(divContainer);
        btn = document.getElementById('chatbotBtn');
        modalEl = document.getElementById('chatbotModal');
    }

    if (btn && modalEl) {
        if (!btn.dataset.bound) {
            btn.dataset.bound = 'true';
            btn.addEventListener('click', function () {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
                const msgCont = document.getElementById('chatbotMessages');
                if (msgCont && msgCont.children.length === 0) {
                    mostrarBienvenidaChimuelo(msgCont, true);
                }
                setTimeout(() => {
                    const input = document.getElementById('chatbotInput');
                    if (input) input.focus();
                }, 300);
            });
        }

        const inputEl = document.getElementById('chatbotInput');
        const sendBtn = document.getElementById('chatbotSend');
        const msgCont = document.getElementById('chatbotMessages');

        if (sendBtn && !sendBtn.dataset.bound) {
            sendBtn.dataset.bound = 'true';
            sendBtn.addEventListener('click', () => {
                if (inputEl && inputEl.value.trim()) {
                    procesarConsultaChimuelo(inputEl.value.trim(), msgCont, inputEl);
                }
            });
        }
        if (inputEl && !inputEl.dataset.bound) {
            inputEl.dataset.bound = 'true';
            inputEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (inputEl.value.trim()) {
                        procesarConsultaChimuelo(inputEl.value.trim(), msgCont, inputEl);
                    }
                }
            });
        }
    }

    // Función de bienvenida estandarizada para ambos widgets
    function mostrarBienvenidaChimuelo(contenedor, incluyeChips) {
        if (!contenedor) return;
        contenedor.innerHTML = `
            <div class="chat-bubble-bot p-2.5 rounded-3 bg-white border shadow-sm" style="max-width: 90%;">
                ¡Hola! 🐉 Soy <strong>Chimuelo IA</strong>, tu asistente de tecnología en eDark Import.<br><br>
                ¿En qué puedo ayudarte hoy? Puedes preguntarme por:
                <ul class="mb-2 ps-3 mt-1 small text-muted">
                    <li>Disponibilidad y precio de hardware</li>
                    <li>Rastreo y estado de tus pedidos</li>
                    <li>Cotización de PC Personalizada</li>
                    <li>Garantías, envíos y pagos</li>
                </ul>
                ${incluyeChips ? `
                <div class="chat-quick-chips d-flex flex-wrap gap-1 mt-2">
                    <span class="badge bg-light text-primary border p-1.5 cursor-pointer" onclick="enviarMensajeRapidoChimuelo('Laptops en stock')">💻 Laptops</span>
                    <span class="badge bg-light text-primary border p-1.5 cursor-pointer" onclick="enviarMensajeRapidoChimuelo('Discos SSD')">🔍 Discos SSD</span>
                    <span class="badge bg-light text-primary border p-1.5 cursor-pointer" onclick="enviarMensajeRapidoChimuelo('Armar PC')">🎮 Armar PC</span>
                    <span class="badge bg-light text-primary border p-1.5 cursor-pointer" onclick="enviarMensajeRapidoChimuelo('Estado de mi pedido')">📦 Mis Pedidos</span>
                </div>` : ''}
            </div>`;
    }

    // Motor central de respuesta del Asistente Chimuelo
    window.procesarConsultaChimuelo = function (texto, msgCont, inputEl) {
        if (!texto || !texto.trim() || !msgCont) return;

        // 1. Burbuja del usuario
        const userDiv = document.createElement('div');
        userDiv.className = 'chat-bubble-user align-self-end p-2.5 rounded-3 bg-primary text-white shadow-sm';
        userDiv.style.maxWidth = '85%';
        userDiv.style.wordBreak = 'break-word';
        userDiv.textContent = texto;
        msgCont.appendChild(userDiv);
        if (inputEl) inputEl.value = '';
        msgCont.scrollTop = msgCont.scrollHeight;

        // 2. Indicador de escritura ("pensando...")
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-bubble-bot typing-dots align-self-start p-2 rounded-3 bg-white border text-muted small shadow-sm';
        typingDiv.innerHTML = '<span class="spinner-border spinner-border-sm me-2 text-primary"></span>Chimuelo analizando consulta...';
        msgCont.appendChild(typingDiv);
        msgCont.scrollTop = msgCont.scrollHeight;

        // 3. Procesamiento y generación de respuesta inteligente
        setTimeout(async () => {
            if (typingDiv && typingDiv.parentNode) typingDiv.parentNode.removeChild(typingDiv);

            const t = texto.toLowerCase().trim();
            let respuestaHtml = '';

            // A) Consultas de Pedidos / Rastreo / Tracking
            if (t.includes('pedido') || t.includes('orden') || t.includes('rastreo') || t.includes('tracking') || t.includes('código') || t.includes('shalom') || t.includes('olva')) {
                const pedidosGuardados = JSON.parse(localStorage.getItem('pedidos_edark') || '[]');
                if (pedidosGuardados.length > 0) {
                    const ultimo = pedidosGuardados[pedidosGuardados.length - 1];
                    respuestaHtml = `
                        <strong>📦 Información de Pedidos eDark:</strong><br>
                        Encontré tu último pedido registrado en este dispositivo: <strong>#${ultimo.id || 'ED-1029'}</strong> (${ultimo.fecha || 'Reciente'}).<br>
                        Estado actual: <span class="badge bg-success">${ultimo.estado || 'En Proceso / Despachado'}</span><br><br>
                        Puedes consultar el historial completo con guías de rastreo directamente aquí:
                        <div class="mt-2 text-center">
                            <a href="mis-pedidos.html" class="btn btn-sm btn-outline-primary w-100 fw-bold"><i class="bi bi-box-seam me-1"></i>Ver Mis Pedidos</a>
                        </div>`;
                } else {
                    respuestaHtml = `
                        <strong>📦 Rastreo de Pedidos eDark:</strong><br>
                        Para verificar el estado exacto de tu envío (por Shalom, Olva o Delivery en Lima), puedes usar tu código o número de orden en nuestra sección oficial de pedidos.<br><br>
                        ¿Deseas verificar tu pedido ahora o contactar a despacho por WhatsApp?
                        <div class="mt-2 d-flex flex-column gap-1">
                            <a href="mis-pedidos.html" class="btn btn-sm btn-outline-primary w-100 fw-bold">Sección Mis Pedidos</a>
                            <a href="https://wa.me/51916907657?text=${encodeURIComponent('Hola, deseo consultar el estado de mi pedido: ' + texto)}" target="_blank" class="btn btn-sm btn-success w-100"><i class="bi bi-whatsapp me-1"></i>Consultar por WhatsApp</a>
                        </div>`;
                }
            }
            // B) Armar PC / Personalizada / Cotizar
            else if (t.includes('armar') || t.includes('personaliz') || t.includes('cotiz') || t.includes('gamer') || t.includes('workstation') || (t.includes('pc') && (t.includes('cuanto') || t.includes('precio')))) {
                respuestaHtml = `
                    <strong>🖥️ Cotizador eDark Alpha PC:</strong><br>
                    ¡Una decisión excelente! Contamos con nuestra herramienta especializada de <strong>PC Personalizada</strong> donde puedes combinar procesador (Intel/AMD), RAM, placa base, tarjeta de vídeo y SSD con precios al por mayor y ensamblaje profesional incluido.<br><br>
                    <div class="text-center mt-1">
                        <a href="pc-personalizada.html" class="btn btn-sm btn-primary w-100 fw-bold shadow-sm"><i class="bi bi-pc-display me-1"></i>Ir a Armar mi PC ahora</a>
                    </div>`;
            }
            // C) Tiempos de Envío y Cobertura
            else if (t.includes('envio') || t.includes('envío') || t.includes('demora') || t.includes('llega') || t.includes('lima') || t.includes('provincia')) {
                respuestaHtml = `
                    <strong>🚚 Envíos y Cobertura Nacional:</strong><br>
                    • <strong>Lima Metropolitana:</strong> Entrega express en <strong>24 a 48 horas hábiles</strong> directo a tu domicilio u oficina.<br>
                    • <strong>Provincias:</strong> Despachamos todos los días vía <strong>Olva Courier</strong> o <strong>Shalom</strong> con número de tracking (tiempo estimado 2 a 4 días hábiles).<br>
                    ¡Todos los envíos van asegurados y con embalaje reforzado!`;
            }
            // D) Métodos de Pago
            else if (t.includes('pago') || t.includes('pagar') || t.includes('yape') || t.includes('plin') || t.includes('tarjeta') || t.includes('bcp')) {
                respuestaHtml = `
                    <strong>💳 Métodos de Pago Disponibles:</strong><br>
                    • <strong>Yape y Plin:</strong> Cero comisiones (pago directo y rápido).<br>
                    • <strong>Transferencia Bancaria:</strong> Cuentas empresariales en BCP, Interbank y BBVA.<br>
                    • <strong>Tarjetas de Crédito/Débito:</strong> Aceptamos Visa, Mastercard y PayPal desde nuestro carrito de compras 100% encriptado.`;
            }
            // E) Garantías y Devoluciones
            else if (t.includes('garant') || t.includes('devoluc') || t.includes('falla') || t.includes('cambio')) {
                respuestaHtml = `
                    <strong>🛡️ Garantía Oficial eDark:</strong><br>
                    Todos nuestros equipos y componentes tienen garantía legal de fábrica. Además, brindamos <strong>7 días de cambio directo</strong> para fallas de hardware, siempre que conserves el empaque original intacto.`;
            }
            // F) Saludos / Ayuda General
            else if (t === 'hola' || t === 'buenas' || t.includes('quién eres') || t.includes('quien eres') || t.includes('chimuelo')) {
                respuestaHtml = `
                    ¡Hola! 🐉 Soy <strong>Chimuelo IA</strong>, tu asistente inteligente de eDark Alpha Technologies.<br><br>
                    Estoy aquí para buscarte el mejor hardware, responder tus dudas o ayudarte a armar tu equipo ideal. ¿Qué te gustaría consultar hoy?`;
            }
            // G) Búsqueda en Catálogo en Vivo (Productos, Hardware, Especificaciones)
            else {
                let cache = window.productosCache || [];
                if (cache.length === 0 && typeof firebase !== 'undefined' && firebase && firebase.firestore) {
                    try {
                        const snap = await firebase.firestore().collection('productos').where('activo', '==', true).get();
                        snap.forEach(doc => cache.push({ id: doc.id, ...doc.data() }));
                        window.productosCache = cache;
                    } catch (err) {}
                }

                const coincidencias = cache.filter(p => {
                    const n = (p.nombre || '').toLowerCase();
                    const c = (p.categoria || '').toLowerCase();
                    const s = (p.subcategoria || '').toLowerCase();
                    const m = (p.marca || '').toLowerCase();
                    const mod = (p.modelo || '').toLowerCase();
                    const cap = (p.capacidad || '').toLowerCase();
                    return n.includes(t) || c.includes(t) || s.includes(t) || m.includes(t) || mod.includes(t) || cap.includes(t);
                }).slice(0, 3);

                if (coincidencias.length > 0) {
                    respuestaHtml = `¡Encontré estas opciones disponibles para "<strong>${sanitize(texto)}</strong>" en nuestro catálogo! 🐉🔥:<br><br>`;
                    coincidencias.forEach(p => {
                        let pr = parseFloat(p.precioVenta) || parseFloat(p.precio) || 0;
                        if (window.calcularPrecioProducto) pr = window.calcularPrecioProducto(p);
                        const img = safeImageUrl(p.imagenUrl || p.imagen || 'img/productos/default.png');
                        respuestaHtml += `
                            <div class="p-2 mb-2 bg-white rounded-3 border shadow-sm d-flex align-items-center justify-content-between gap-2">
                                <img src="${img}" class="rounded" style="width: 44px; height: 44px; object-fit: cover;" alt="${sanitize(p.nombre)}" onerror="this.src='img/productos/default.png'">
                                <div class="overflow-hidden flex-grow-1">
                                    <strong class="d-block text-truncate text-dark" style="font-size: 0.85rem;" title="${sanitize(p.nombre)}">${sanitize(p.nombre)}</strong>
                                    <span class="text-primary fw-bold" style="font-size: 0.88rem;">S/ ${pr.toFixed(2)}</span>
                                    <span class="badge bg-light text-success border ms-1" style="font-size: 0.65rem;">Stock disponible</span>
                                </div>
                                <a href="producto.html?id=${p.id}" class="btn btn-sm btn-outline-primary flex-shrink-0 fw-bold px-2">Ver</a>
                            </div>`;
                    });
                } else {
                    respuestaHtml = `
                        ¡Entendido! 🐉 No encontré un producto exacto llamado "<strong>${sanitize(texto)}</strong>" en el catálogo actual online, pero tenemos constantes ingresos en almacén y pedidos de importación a pedido.<br><br>
                        ¿Deseas consultar con un asesor de ventas por WhatsApp para verificar disponibilidad inmediata?
                        <div class="mt-2 text-center">
                            <a href="https://wa.me/51916907657?text=${encodeURIComponent('Hola, busco disponibilidad y precio de: ' + texto)}" target="_blank" class="btn btn-sm btn-success w-100 fw-bold shadow-sm"><i class="bi bi-whatsapp me-1"></i>Consultar con un Asesor (+51 916 907 657)</a>
                        </div>`;
                }
            }

            // Agregar respuesta del bot con sugerencias rápidas
            const botDiv = document.createElement('div');
            botDiv.className = 'chat-bubble-bot align-self-start p-2.5 rounded-3 bg-white border shadow-sm';
            botDiv.style.maxWidth = '92%';
            botDiv.innerHTML = respuestaHtml + `
                <div class="d-flex flex-wrap gap-1 mt-2 pt-2 border-top">
                    <span class="badge bg-light text-secondary border cursor-pointer" style="font-size: 0.72rem;" onclick="enviarMensajeRapidoChimuelo('Discos SSD en oferta')">🔍 SSDs</span>
                    <span class="badge bg-light text-secondary border cursor-pointer" style="font-size: 0.72rem;" onclick="enviarMensajeRapidoChimuelo('Laptops')">💻 Laptops</span>
                    <span class="badge bg-light text-secondary border cursor-pointer" style="font-size: 0.72rem;" onclick="enviarMensajeRapidoChimuelo('Armar PC')">🎮 Armar PC</span>
                    <span class="badge bg-light text-secondary border cursor-pointer" style="font-size: 0.72rem;" onclick="enviarMensajeRapidoChimuelo('Mis Pedidos')">📦 Pedidos</span>
                </div>`;
            msgCont.appendChild(botDiv);
            msgCont.scrollTop = msgCont.scrollHeight;
        }, 550);
    };

    // Exponer globalmente para las chips rápidas
    window.enviarMensajeRapidoChimuelo = function (texto) {
        let cont = document.getElementById('chatbotMessages') || document.getElementById('ai-chimuelo-messages');
        let inp = document.getElementById('chatbotInput') || document.getElementById('ai-chimuelo-input');
        procesarConsultaChimuelo(texto, cont, inp);
    };
}

// Inicializar ambos motores en el arranque del sitio
document.addEventListener('DOMContentLoaded', function () {
    inicializarBusquedaPredictiva();
    inicializarChimueloIA();
});
