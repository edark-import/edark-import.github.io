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
// Forzar HTTPS
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    location.href = 'https://' + location.hostname + location.pathname + location.search;
}
// Protección clickjacking
if (window.top !== window.self) window.top.location = window.self.location;

// --- VARIABLES GLOBALES ---
let tipoCambioGlobal = 3.8; // Tipo de cambio SUNAT global
let configGeneral = null;   // Configuración global desde Firestore
// Número de WhatsApp para pedidos. Cambia aquí tu número en formato internacional, sin espacios ni signos.
const phone = '51916907657'; // <-- Cambia este número por el tuyo
let productosCache = [];
let paginaActual = 1;
const productosPorPagina = 12;
let unsubscribe = null;
let textoBusqueda = '';

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

// --- CARGA DINÁMICA GLOBAL DE NAVBAR Y FOOTER ---
async function cargarNavbarYFooterGlobal() {
    const navbarTarget = document.getElementById('navbar') || document.getElementById('navbar-container');
    const footerTarget = document.getElementById('footer') || document.getElementById('footer-container');

    if (navbarTarget && navbarTarget.innerHTML.trim() === '') {
        try {
            const res = await fetch('navbar.html');
            if (res.ok) {
                const html = await res.text();
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
                actualizarContadorCarrito();
            }
        } catch (e) {
            console.warn('Fallo al cargar navbar dinámico:', e.message);
        }
    }

    if (footerTarget && footerTarget.innerHTML.trim() === '') {
        try {
            const res = await fetch('footer.html');
            if (res.ok) {
                const html = await res.text();
                footerTarget.innerHTML = html;
                console.log('Footer dinámico cargado.');
            }
        } catch (e) {
            console.warn('Fallo al cargar footer dinámico:', e.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // Cargar navbar y footer primero
    await cargarNavbarYFooterGlobal();

    // Asegurar que Firebase esté inicializado antes de proceder
    if (typeof db === 'undefined') {
        console.error('Firebase DB no inicializado. Verifica firebase-config.js');
        // Reintentar brevemente si es por delay de carga
        setTimeout(async () => {
            if (typeof db !== 'undefined') {
                await iniciarTodo();
            }
        }, 1000);
        return;
    }
    await iniciarTodo();
});

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
                if (campo === 'categoria') mostrarSubcategorias(valor);
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
            renderProductosPaginados();
        });
    }
}

    // Funciones auxiliares para mostrar/ocultar subcategorías
    function mostrarSubcategorias(categoria) {
        document.querySelectorAll(`[data-parent="${categoria}"]`).forEach(subcatCheckbox => {
            subcatCheckbox.closest('.form-check').style.display = 'block';
        });
    }

    function ocultarYLimpiarSubcategorias(categoria) {
        document.querySelectorAll(`[data-parent="${categoria}"]`).forEach(subcatCheckbox => {
            subcatCheckbox.checked = false;
            subcatCheckbox.closest('.form-check').style.display = 'none';
            // Remover de filtros seleccionados
            const valor = subcatCheckbox.value;
            filtrosSeleccionados['subcategoria'] = filtrosSeleccionados['subcategoria'].filter(v => v !== valor);
        });
    }

    // Ocultar todas las subcategorías inicialmente
    document.querySelectorAll('[data-campo="subcategoria"]').forEach(subcatCheckbox => {
        subcatCheckbox.closest('.form-check').style.display = 'none';
    });

    // Función para actualizar filtros dinámicamente
    function actualizarFiltrosDinamicos() {
        // Obtener productos que coinciden con los filtros actuales (excepto el campo que estamos actualizando)
        const productosFiltrados = productosCache.filter(producto => {
            for (const campo of Object.keys(filtrosSeleccionados)) {
                const valores = filtrosSeleccionados[campo];
                if (valores && valores.length > 0) {
                    if (campo === 'subcategoria') {
                        const categoriasSeleccionadas = filtrosSeleccionados['categoria'] || [];
                        if (categoriasSeleccionadas.length > 0) {
                            if (!categoriasSeleccionadas.includes(producto.categoria)) {
                                return false;
                            }
                            if (!valores.includes(producto.subcategoria)) {
                                return false;
                            }
                        } else {
                            if (!valores.includes(producto.subcategoria)) {
                                return false;
                            }
                        }
                    } else if (campo === 'categoria') {
                        if (!valores.includes(producto.categoria)) {
                            return false;
                        }
                    } else {
                        const productoValor = producto[campo] || '';
                        if (!valores.includes(productoValor)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        });

        // Calcular valores disponibles para cada campo basado en productos filtrados
        const valoresDisponibles = {};
        camposFiltro.forEach(f => valoresDisponibles[f.campo] = new Set());

        productosFiltrados.forEach(prod => {
            camposFiltro.forEach(f => {
                if (prod[f.campo]) valoresDisponibles[f.campo].add(prod[f.campo]);
            });
        });

        // Actualizar las opciones de cada filtro
        camposFiltro.forEach(campo => {
            if (campo.campo === 'categoria' || campo.campo === 'subcategoria') return; // Estos ya se manejan especialmente

            const checkboxes = document.querySelectorAll(`[data-campo="${campo.campo}"]`);
            checkboxes.forEach(cb => {
                const valor = cb.value;
                const estaDisponible = valoresDisponibles[campo.campo].has(valor);
                const estaSeleccionado = filtrosSeleccionados[campo.campo].includes(valor);

                cb.closest('.form-check').style.display = estaDisponible || estaSeleccionado ? 'block' : 'none';
                cb.disabled = !estaDisponible && !estaSeleccionado;

                if (!estaDisponible && !estaSeleccionado) {
                    cb.checked = false;
                    filtrosSeleccionados[campo.campo] = filtrosSeleccionados[campo.campo].filter(v => v !== valor);
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

    // Detecta si el usuario está autenticado (admin)
    const user = firebase.auth().currentUser;

    productosPagina.forEach((prod, idx) => {
        contenedor.innerHTML += `
            <div class="col mb-5">
                <div class="card h-100 shadow-sm border-0 position-relative overflow-hidden">
                    <a href="producto.html?id=${prod.id}" class="text-decoration-none text-dark d-block text-center overflow-hidden" style="height: 220px;">
                        <img class="card-img-top w-100 h-100 p-3" src="${safeImageUrl(prod.imagenUrl || prod.imagen || '')}" alt="${sanitize(prod.nombre)}" loading="lazy" decoding="async" style="object-fit: contain; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" />
                    </a>
                    <div class="card-body p-3 d-flex flex-column">
                        <div class="text-center flex-grow-1">
                            <a href="producto.html?id=${prod.id}" class="text-decoration-none text-dark">
                                <h6 class="fw-bolder mb-2 text-truncate" title="${sanitize(prod.nombre || 'Producto')}">${sanitize(prod.nombre || 'Producto')}</h6>
                            </a>
                            <div class="d-flex justify-content-center small text-warning mb-2">
                                <i class="bi bi-star-fill"></i>
                                <i class="bi bi-star-fill"></i>
                                <i class="bi bi-star-fill"></i>
                                <i class="bi bi-star-fill"></i>
                                <i class="bi bi-star-fill"></i>
                            </div>
                            <span class="fs-5 fw-bold text-primary">S/ ${sanitize(calcularPrecioProducto(prod))}</span>
                        </div>
                    </div>
                    <div class="card-footer p-3 pt-0 border-top-0 bg-transparent">
                        <div class="d-flex justify-content-center gap-2">
                            <a href="producto.html?id=${prod.id}" class="btn btn-sm btn-outline-dark flex-grow-1">Ver Detalles</a>
                            <button type="button" class="btn btn-sm btn-primary" onclick="agregarAlCarritoDesdeCard('${prod.id}', event)" title="Agregar al Carrito">
                                <i class="bi bi-cart-plus"></i>
                            </button>
                            ${user ? `<button class="btn btn-sm btn-outline-secondary btn-editar-producto" data-id="${prod.id}" title="Editar"><i class="bi bi-pencil"></i></button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    if (contenedor.innerHTML === '') {
        contenedor.innerHTML = `<div class="col-12 text-center text-muted py-5">No hay productos que coincidan con los filtros seleccionados.</div>`;
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

// Mostrar/ocultar panel según autenticación
auth.onAuthStateChanged(user => {
    const adminContainer = document.getElementById('adminContainer');
    if (adminContainer) {
        if (user) {
            adminContainer.classList.remove('d-none');
            const loginModalEl = document.getElementById('loginModal');
            const loginModal = loginModalEl ? bootstrap.Modal.getInstance(loginModalEl) : null;
            if (loginModal) loginModal.hide();
        } else {
            adminContainer.classList.add('d-none');
        }
    }
    // Renderiza productos para mostrar/ocultar botón Editar según el usuario
    renderProductosPaginados();
});

// Botón cerrar sesión en navbar
(function () {
    const logoutBtnNav = document.getElementById('logoutBtnNav');
    if (logoutBtnNav) {
        logoutBtnNav.addEventListener('click', function () {
            auth.signOut();
        });
    }
})();

// Mostrar/ocultar botones de login/logout y email
auth.onAuthStateChanged(user => {
    const logoutBtn = document.getElementById('logoutBtnNav');
    const userEmail = document.getElementById('userEmail');
    if (user) {
        if (logoutBtn) logoutBtn.classList.remove('d-none');
        if (userEmail) { userEmail.textContent = user.email || ''; userEmail.classList.remove('d-none'); }
    } else {
        if (logoutBtn) logoutBtn.classList.add('d-none');
        if (userEmail) userEmail.classList.add('d-none');
    }
});

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
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

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

    // Asegurar que haya productos en caché
    async function garantizarCacheProductos() {
        if (window.productosCache && window.productosCache.length > 0) return window.productosCache;
        if (!firebase || !firebase.firestore) return [];
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

    inputs.forEach(input => {
        // Encontrar el dropdown asociado
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

            // Si es el buscador principal de index.html, actualizar también la cuadrícula general
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
                return nom.includes(query) || mar.includes(query) || mod.includes(query) || cat.includes(query) || sub.includes(query);
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
                    <a href="producto.html?id=${prod.id}" class="live-search-item" data-index="${idx}">
                        <img src="${imgSrc}" class="live-search-img" alt="${sanitize(prod.nombre)}" loading="lazy" decoding="async" onerror="this.src='img/productos/default.png'">
                        <div class="live-search-info">
                            <div class="live-search-title">${sanitize(prod.nombre)}</div>
                            <div class="live-search-meta">${sanitize(prod.marca || 'eDark')} • ${sanitize(prod.capacidad || prod.categoria || '')}</div>
                        </div>
                        <div class="live-search-price">S/ ${precio.toFixed(2)}</div>
                    </a>`;
            });

            dropdown.innerHTML = html;
            dropdown.classList.remove('d-none');
            activeIndex = -1;
        });

        // Navegación por teclado
        input.addEventListener('keydown', function (e) {
            const items = dropdown.querySelectorAll('.live-search-item');
            if (!items || items.length === 0 || dropdown.classList.contains('d-none')) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = (activeIndex + 1) % items.length;
                items.forEach((it, i) => it.classList.toggle('active', i === activeIndex));
                if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = (activeIndex - 1 + items.length) % items.length;
                items.forEach((it, i) => it.classList.toggle('active', i === activeIndex));
                if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                if (activeIndex >= 0 && items[activeIndex]) {
                    e.preventDefault();
                    items[activeIndex].click();
                }
            } else if (e.key === 'Escape') {
                dropdown.classList.add('d-none');
            }
        });

        // Cerrar dropdown al enfocar fuera
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
// ASISTENTE VIRTUAL CHIMUELO IA (CHATBOT INTELIGENTE)
// =========================================================
function inicializarChimueloIA() {
    let btn = document.getElementById('chatbotBtn');
    let modalEl = document.getElementById('chatbotModal');

    // Si no existe el chatbot en esta página (ej. producto.html, soporte.html), inyectarlo automáticamente
    if (!btn || !modalEl) {
        const divContainer = document.createElement('div');
        divContainer.innerHTML = `
            <button id="chatbotBtn" style="position:fixed;bottom:30px;right:30px;z-index:1050;"
                class="btn btn-primary rounded-circle shadow-lg p-0" aria-label="Abrir chat virtual Chimuelo IA" title="Asistente virtual Chimuelo IA">
                <img src="img/Logo/isotipo_Negro.png" alt="Icono de Chimuelo IA" style="width: 50px; height: auto;">
            </button>
            <div class="modal fade" id="chatbotModal" tabindex="-1" aria-labelledby="chatbotModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-bottom modal-sm" style="position:fixed;bottom:0;right:30px;max-width:360px;margin:0;z-index:1060;">
                    <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
                        <div class="modal-header py-2 bg-primary text-white">
                            <div class="d-flex align-items-center gap-2">
                                <img src="img/Logo/isotipo_Negro.png" alt="Chimuelo" style="width:28px;height:28px;filter:brightness(10);">
                                <h6 class="modal-title mb-0 fw-bold" id="chatbotModalLabel">Chimuelo IA</h6>
                            </div>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body" id="chatbotMessages" style="max-height:340px;overflow-y:auto;font-size:0.95em;">
                            <div class="chat-bubble-bot">
                                ¡Hola! 🐉 Soy <strong>Chimuelo IA</strong>, tu asistente tecnológico en eDark Import. ¿En qué puedo ayudarte hoy?
                                <div class="chat-quick-chips">
                                    <span class="chat-chip" onclick="enviarMensajeRapidoChimuelo('Discos SSD')">🔍 Discos SSD</span>
                                    <span class="chat-chip" onclick="enviarMensajeRapidoChimuelo('Laptops')">💻 Laptops</span>
                                    <span class="chat-chip" onclick="enviarMensajeRapidoChimuelo('Tiempos de envío')">🚚 Envíos</span>
                                    <span class="chat-chip" onclick="enviarMensajeRapidoChimuelo('Métodos de pago')">💳 Pagos</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer py-2 bg-light border-top">
                            <div class="input-group input-group-sm">
                                <input type="text" id="chatbotInput" class="form-control" placeholder="Escribe tu consulta..." autocomplete="off">
                                <button id="chatbotSend" class="btn btn-primary px-3"><i class="bi bi-send-fill"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(divContainer);
        btn = document.getElementById('chatbotBtn');
        modalEl = document.getElementById('chatbotModal');
    } else {
        // Asegurar estructura del modal existente si venía de index.html básico
        const msgContainer = document.getElementById('chatbotMessages');
        if (msgContainer && !msgContainer.querySelector('.chat-bubble-bot')) {
            msgContainer.innerHTML = `
                <div class="chat-bubble-bot">
                    ¡Hola! 🐉 Soy <strong>Chimuelo IA</strong>, tu asistente tecnológico en eDark Import. ¿En qué puedo ayudarte hoy?
                    <div class="chat-quick-chips">
                        <span class="chat-chip" onclick="enviarMensajeRapidoChimuelo('Discos SSD')">🔍 Discos SSD</span>
                        <span class="chat-chip" onclick="enviarMensajeRapidoChimuelo('Laptops')">💻 Laptops</span>
                        <span class="chat-chip" onclick="enviarMensajeRapidoChimuelo('Tiempos de envío')">🚚 Envíos</span>
                        <span class="chat-chip" onclick="enviarMensajeRapidoChimuelo('Métodos de pago')">💳 Pagos</span>
                    </div>
                </div>`;
        }
    }

    if (!btn || !modalEl) return;

    btn.addEventListener('click', function () {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
        setTimeout(() => {
            const input = document.getElementById('chatbotInput');
            if (input) input.focus();
        }, 300);
    });

    const inputEl = document.getElementById('chatbotInput');
    const sendBtn = document.getElementById('chatbotSend');

    function procesarYResponder(texto) {
        if (!texto || !texto.trim()) return;
        const msgCont = document.getElementById('chatbotMessages');
        if (!msgCont) return;

        // 1. Burbuja del usuario
        const userDiv = document.createElement('div');
        userDiv.className = 'chat-bubble-user';
        userDiv.textContent = texto;
        msgCont.appendChild(userDiv);
        inputEl.value = '';
        msgCont.scrollTop = msgCont.scrollHeight;

        // 2. Indicador de escritura
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-bubble-bot typing-dots';
        typingDiv.innerHTML = 'Chimuelo está pensando <span></span><span></span><span></span>';
        msgCont.appendChild(typingDiv);
        msgCont.scrollTop = msgCont.scrollHeight;

        // 3. Evaluar respuesta
        setTimeout(async () => {
            if (typingDiv && typingDiv.parentNode) typingDiv.parentNode.removeChild(typingDiv);

            const t = texto.toLowerCase().trim();
            let respuestaHtml = '';

            if (t.includes('envio') || t.includes('envío') || t.includes('demora') || t.includes('olva') || t.includes('llega') || t.includes('lima')) {
                respuestaHtml = `
                    <strong>🚚 Tiempos y Envíos eDark Import:</strong><br>
                    • <strong>Lima Metropolitana:</strong> Entrega rápida en 24 a 48 horas hábiles directamente en tu domicilio.<br>
                    • <strong>Provincias:</strong> Despachamos diariamente por Olva Courier o Shalom (tiempo estimado de 2 a 4 días hábiles con tracking seguro).<br>
                    ¡Todos nuestros paquetes viajan protegidos contra accidentes!`;
            } else if (t.includes('pago') || t.includes('pagar') || t.includes('yape') || t.includes('plin') || t.includes('tarjeta') || t.includes('paypal')) {
                respuestaHtml = `
                    <strong>💳 Métodos de Pago Seguros:</strong><br>
                    • <strong>Yape y Plin:</strong> Aceptamos pagos instantáneos sin recargos.<br>
                    • <strong>Transferencias:</strong> BCP, Interbank y BBVA.<br>
                    • <strong>Tarjetas:</strong> Visa, Mastercard, American Express y PayPal a través de nuestra pasarela encriptada.`;
            } else if (t.includes('garant') || t.includes('devoluc') || t.includes('fallas') || t.includes('cambio')) {
                respuestaHtml = `
                    <strong>🛡️ Garantía Oficial:</strong><br>
                    Todos los productos y repuestos vendidos en eDark Import cuentan con garantía por defectos de fábrica. Tienes 7 días para cambios directos con el empaque original intacto.`;
            } else if (t.includes('hola') || t.includes('buenas') || t.includes('quién eres') || t.includes('quien eres') || t.includes('chimuelo')) {
                respuestaHtml = `
                    ¡Hola! 🐉 Soy <strong>Chimuelo IA</strong>, tu asistente y dragón cibernético en eDark Import. Puedo ayudarte a buscar productos (como SSDs, memorias RAM, laptops) o responder tus dudas sobre compras. ¿Qué necesitas encontrar hoy?`;
            } else {
                // Búsqueda en caché de productos
                let cache = window.productosCache || [];
                if (cache.length === 0 && firebase && firebase.firestore) {
                    try {
                        const snap = await firebase.firestore().collection('productos').where('activo', '==', true).get();
                        snap.forEach(doc => cache.push({ id: doc.id, ...doc.data() }));
                        window.productosCache = cache;
                    } catch (err) { }
                }

                const coincidencias = cache.filter(p => {
                    const n = (p.nombre || '').toLowerCase();
                    const c = (p.categoria || '').toLowerCase();
                    const s = (p.subcategoria || '').toLowerCase();
                    const m = (p.marca || '').toLowerCase();
                    return n.includes(t) || c.includes(t) || s.includes(t) || m.includes(t);
                }).slice(0, 3);

                if (coincidencias.length > 0) {
                    respuestaHtml = `¡Encontré estos productos para ti en nuestro catálogo! 🐉🔥:<br><br>`;
                    coincidencias.forEach(p => {
                        let pr = parseFloat(p.precioVenta) || parseFloat(p.precio) || 0;
                        if (window.calcularPrecioProducto) pr = window.calcularPrecioProducto(p);
                        respuestaHtml += `
                            <div class="p-2 mb-2 bg-light rounded border d-flex align-items-center justify-content-between">
                                <div class="text-truncate me-2" style="max-width: 180px;">
                                    <strong class="d-block text-truncate" title="${sanitize(p.nombre)}">${sanitize(p.nombre)}</strong>
                                    <span class="text-primary fw-bold">S/ ${pr.toFixed(2)}</span>
                                </div>
                                <a href="producto.html?id=${p.id}" class="btn btn-sm btn-primary flex-shrink-0">Ver</a>
                            </div>`;
                    });
                } else {
                    respuestaHtml = `
                        ¡Entendido! 🐉 Por el momento no encontré una coincidencia exacta para "<strong>${sanitize(texto)}</strong>" en el catálogo en línea, pero nuestro equipo puede importarlo o verificar almacén.<br><br>
                        ¿Deseas chatear con un asesor humano en WhatsApp?
                        <div class="mt-2 text-center">
                            <a href="https://wa.me/51999999999?text=Hola,%20busco%20información%20sobre:%20${encodeURIComponent(texto)}" target="_blank" class="btn btn-sm btn-success w-100"><i class="bi bi-whatsapp me-1"></i>Consultar por WhatsApp</a>
                        </div>`;
                }
            }

            const botDiv = document.createElement('div');
            botDiv.className = 'chat-bubble-bot';
            botDiv.innerHTML = respuestaHtml;
            msgCont.appendChild(botDiv);
            msgCont.scrollTop = msgCont.scrollHeight;
        }, 650);
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', () => procesarYResponder(inputEl.value));
    }
    if (inputEl) {
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                procesarYResponder(inputEl.value);
            }
        });
    }

    // Exponer globalmente para las chips rápidas
    window.enviarMensajeRapidoChimuelo = function (texto) {
        procesarYResponder(texto);
    };
}

// Inicializar ambos motores en el arranque del sitio
document.addEventListener('DOMContentLoaded', function () {
    inicializarBusquedaPredictiva();
    inicializarChimueloIA();
});
