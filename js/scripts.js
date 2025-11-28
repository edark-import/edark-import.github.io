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
    // Número de WhatsApp para pedidos. Cambia aquí tu número en formato internacional, sin espacios ni signos.
    const phone = '51916907657'; // <-- Cambia este número por el tuyo
    let productosCache = [];
    let paginaActual = 1;
    const productosPorPagina =12;
    let unsubscribe = null;
    let textoBusqueda = '';

    // --- OBTENER Y MOSTRAR TIPO DE CAMBIO SUNAT UNA SOLA VEZ ---
    async function inicializarTipoCambioSunat() {
        try {
            const res = await fetch('https://corsproxy.io/?https://api.apis.net.pe/v1/tipo-cambio-sunat');
            const data = await res.json();
            if (data && data.venta) {
                tipoCambioGlobal = parseFloat(data.venta);
                const v = document.getElementById('tipoCambioValor');
                const m = document.getElementById('tipoCambioMoneda');
                const f = document.getElementById('tipoCambioFecha');
                const o = document.getElementById('tipoCambioOrigen');
                if (v) v.textContent = tipoCambioGlobal.toFixed(3);
                if (m) m.textContent = `${data.moneda ? data.moneda : 'USD/PEN'}`;
                if (f) f.textContent = data.fecha ? `(${data.fecha})` : '';
                if (o) o.textContent = data.origen ? `- ${data.origen}` : '';
            }
        } catch (e) {
            tipoCambioGlobal = 3.8;
            const v = document.getElementById('tipoCambioValor');
            const m = document.getElementById('tipoCambioMoneda');
            const f = document.getElementById('tipoCambioFecha');
            const o = document.getElementById('tipoCambioOrigen');
            if (v) v.textContent = tipoCambioGlobal.toFixed(2);
            if (m) m.textContent = 'USD/PEN';
            if (f) f.textContent = '';
            if (o) o.textContent = '- Local';
        }
        const tcText = document.getElementById('tipoCambioText');
        if (tcText) tcText.textContent = `S/ ${tipoCambioGlobal.toFixed(2)}`;
    }
    document.addEventListener('DOMContentLoaded', async function () {
        await inicializarTipoCambioSunat();
        await cargarFiltrosDinamicos();
        renderBadges();
        mostrarProductos();
    });

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
    let precioMin = 0, precioMax = 0, precioFiltroMin = 0, precioFiltroMax = 0;

    // 1. Obtiene todos los valores únicos de cada campo desde Firestore
    async function cargarFiltrosDinamicos() {
        const snapshot = await db.collection('productos').get();
        valoresFiltro = {};
        subcategoriasPorCategoria = {};
        camposFiltro.forEach(f => valoresFiltro[f.campo] = new Set());
        let precios = [];
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
            if (typeof prod.precio === "number") precios.push(prod.precio);
        });

        // Filtro de precio
        precioMin = Math.min(...precios);
        precioMax = Math.max(...precios);
        precioFiltroMin = precioMin;
        precioFiltroMax = precioMax;

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
        html += `</div></div></div>`;

        // Resto de filtros
        ["marca", "capacidad", "modelo", "dimension"].forEach(campo => {
            html += `
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#filter-${campo}">
                        ${camposFiltro.find(f => f.campo === campo).label}
                    </button>
                </h2>
                <div id="filter-${campo}" class="accordion-collapse collapse">
                    <div class="accordion-body">
            `;
            Array.from(valoresFiltro[campo]).sort().forEach(valor => {
                const id = `filter-${campo}-${valor.replace(/[^a-zA-Z0-9]/g, '')}`;
                html += `
                    <div class="form-check">
                        <input class="form-check-input filter-checkbox" type="checkbox" value="${valor}" id="${id}" data-campo="${campo}">
                        <label class="form-check-label" for="${id}">${valor}</label>
                    </div>
                `;
            });
            html += `</div></div></div>`;
        });

        document.getElementById('dynamic-filters').innerHTML = html;

        // Eventos para filtros
        document.querySelectorAll('.filter-checkbox').forEach(cb => {
            cb.addEventListener('change', function () {
                const campo = this.dataset.campo;
                const valor = this.value;
                const parentCategoria = this.dataset.parent; // Para subcategorías

                if (this.checked) {
                    if (!filtrosSeleccionados[campo].includes(valor)) {
                        filtrosSeleccionados[campo].push(valor);
                    }

                    // Si es una categoría, mostrar sus subcategorías
                    if (campo === 'categoria') {
                        mostrarSubcategorias(valor);
                    }
                } else {
                    filtrosSeleccionados[campo] = filtrosSeleccionados[campo].filter(v => v !== valor);

                    // Si es una categoría, ocultar y deseleccionar sus subcategorías
                    if (campo === 'categoria') {
                        ocultarYLimpiarSubcategorias(valor);
                    }
                }
                actualizarFiltrosDinamicos();
                renderBadges();
                mostrarProductos();
            });
        });

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

        // Filtro de precio
        document.getElementById('precioMin').addEventListener('input', function () {
            let min = parseInt(this.value);
            let max = parseInt(document.getElementById('precioMax').value);
            if (min > max) {
                min = max;
                this.value = min;
            }
            precioFiltroMin = min;
            document.getElementById('precioMinLabel').textContent = min;
            mostrarProductos();
        });
        document.getElementById('precioMax').addEventListener('input', function () {
            let max = parseInt(this.value);
            let min = parseInt(document.getElementById('precioMin').value);
            if (max < min) {
                max = min;
                this.value = max;
            }
            precioFiltroMax = max;
            document.getElementById('precioMaxLabel').textContent = max;
            mostrarProductos();
        });
    }

    function renderBadges() {
        const container = document.getElementById('selected-filters');
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

    document.getElementById('selected-filters').addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-filter')) {
            const campo = e.target.dataset.campo;
            const valor = e.target.dataset.valor;
            const id = e.target.dataset.id;
            if (campo === "precio") {
                // Reset precio
                precioFiltroMin = precioMin;
                precioFiltroMax = precioMax;
                document.getElementById('precioMin').value = precioMin;
                document.getElementById('precioMax').value = precioMax;
                document.getElementById('precioMinLabel').textContent = precioMin;
                document.getElementById('precioMaxLabel').textContent = precioMax;
            } else {
                const cb = document.getElementById(id);
                if (cb) cb.checked = false;
                filtrosSeleccionados[campo] = filtrosSeleccionados[campo].filter(v => v !== valor);
            }
            renderBadges();
            mostrarProductos();
        }
    });

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
            btn.addEventListener('click', function() {
                paginaActual = parseInt(this.dataset.pag);
                renderProductosPaginados();
            });
        });
    }

    // Modifica renderProductosPaginados para filtrar por búsqueda
    // --- RENDERIZA LOS PRODUCTOS Y AGREGA BOTÓN EDITAR SOLO PARA ADMIN ---
function renderProductosPaginados() {
    let productos = productosCache.filter(productoCoincideFiltros);
    // Ordenamiento y paginación
    const orden = document.getElementById('ordenarSelect').value;
    if (orden === "precio-asc") {
        productos.sort((a, b) => (a.precio || 0) - (b.precio || 0));
    } else if (orden === "precio-desc") {
        productos.sort((a, b) => (b.precio || 0) - (a.precio || 0));
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
    const contenedor = document.getElementById('productos');
    contenedor.innerHTML = '';

    // Detecta si el usuario está autenticado (admin)
    const user = firebase.auth().currentUser;

    productosPagina.forEach((prod, idx) => {
        contenedor.innerHTML += `
            <div class="col mb-5">
                <div class="card h-100">
                    <img class="card-img-top" src="${safeImageUrl(prod.imagen || '')}" alt="${sanitize(prod.nombre)}" />
                    <div class="card-body p-4">
                        <div class="text-center">
                            <h5 class="fw-bolder">${sanitize(prod.nombre || 'Producto')}</h5>
                            <div class="d-flex justify-content-center small text-warning mb-2">
                                <div class="bi-star-fill"></div>
                                <div class="bi-star-fill"></div>
                                <div class="bi-star-fill"></div>
                                <div class="bi-star-fill"></div>
                                <div class="bi-star-fill"></div>
                            </div>
                            s/${sanitize(prod.precio || '---')}
                        </div>
                    </div>
                    <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
                        <div class="text-center">
                            <button class="btn btn-outline-dark mt-auto btn-ver-detalles" data-idx="${productosCache.indexOf(prod)}">Ver Detalles</button>
                            ${user ? `<button class="btn btn-outline-primary mt-auto ms-2 btn-editar-producto" data-id="${prod.id}">Editar</button>` : ''}
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
    setTimeout(() => {
        const primerCard = contenedor.querySelector('.card');
        if (primerCard) {
            primerCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 0);
}

// --- AGREGA EVENTO PARA BOTÓN EDITAR SOLO PARA ADMIN ---
function asignarEventosProductos() {
    // Evento Ver Detalles
    document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
        btn.addEventListener('click', function () {
            const idx = parseInt(this.getAttribute('data-idx'));
            const producto = productosCache[idx];
            if (!producto) return;
            document.getElementById('detalleImagen').src = safeImageUrl(producto.imagen || '');
            document.getElementById('detalleNombre').textContent = sanitize(producto.nombre || '');
            document.getElementById('detallePrecio').textContent = producto.precio || '';
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
    document.getElementById('loaderProductos').style.display = 'block';
    document.getElementById('productos').style.display = 'none';

    if (unsubscribe) unsubscribe();
    unsubscribe = db.collection('productos').onSnapshot(snapshot => {
        productosCache = [];
        snapshot.forEach(doc => {
            const prod = doc.data();
            prod.id = doc.id; // Guarda el ID aquí
            productosCache.push(prod);
        });
        paginaActual = 1;
        renderProductosPaginados(); // <--- SOLO así, sin argumentos

        document.getElementById('loaderProductos').style.display = 'none';
        document.getElementById('productos').style.display = '';
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
    document.getElementById('ordenarSelect').addEventListener('change', function() {
        renderProductosPaginados();
    });


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
    (function(){
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                auth.signOut();
            });
        }
    })();

    // Calcula y muestra el precio de venta automáticamente
    // Usa tipoCambioGlobal en vez de llamar a la API cada vez

    // Listeners de cálculo de precio (solo en páginas con formulario admin)
    (function(){
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
    if (adminFormEl) adminFormEl.addEventListener('submit', async function(e) {
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
    (function(){
        const logoutBtnNav = document.getElementById('logoutBtnNav');
        if (logoutBtnNav) {
            logoutBtnNav.addEventListener('click', function() {
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
        document.querySelectorAll('.dropdown-submenu > a').forEach(function(element){
            element.addEventListener('mouseenter', function(e){
                let submenu = element.nextElementSibling;
                if(submenu && submenu.classList.contains('dropdown-menu')) {
                    submenu.classList.add('show');
                }
            });
            element.parentElement.addEventListener('mouseleave', function(e){
                let submenu = element.nextElementSibling;
                if(submenu && submenu.classList.contains('dropdown-menu')) {
                    submenu.classList.remove('show');
                }
            });
        });
    });

    // --- FUNCIÓN PARA FILTRAR PRODUCTOS SEGÚN LOS FILTROS SELECCIONADOS ---
function productoCoincideFiltros(producto) {
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
    if (typeof producto.precio === 'number') {
        if (producto.precio < precioFiltroMin || producto.precio > precioFiltroMax) {
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

// --- EVENTO DE BÚSQUEDA ---
document.addEventListener('DOMContentLoaded', function () {
    const inputBusqueda = document.getElementById('buscadorProductos');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', function () {
            textoBusqueda = this.value.trim().toLowerCase();
            renderProductosPaginados();
        });
    }
});

// --- ASIGNAR EVENTOS A BOTONES "VER DETALLES" ---
function asignarEventosProductos() {
    // Evento Ver Detalles
    document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
        btn.addEventListener('click', function () {
            const idx = parseInt(this.getAttribute('data-idx'));
            const producto = productosCache[idx];
            if (!producto) return;
            document.getElementById('detalleImagen').src = safeImageUrl(producto.imagen || '');
            document.getElementById('detalleNombre').textContent = sanitize(producto.nombre || '');
            document.getElementById('detallePrecio').textContent = producto.precio || '';
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
}

function renderCarrito() {
    const cont = document.getElementById('carritoContenido');
    if (!cont) return;
    if (carrito.length === 0) {
        cont.innerHTML = '<div class="text-center text-muted">El carrito está vacío.</div>';
        return;
    }
    let html = '<ul class="list-group mb-3">';
    carrito.forEach((item, idx) => {
        html += `<li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <img src="${safeImageUrl(item.imagen)}" alt="${sanitize(item.nombre)}" style="width:50px;height:50px;object-fit:cover;" class="me-2 rounded">
                <span class="fw-bold">${sanitize(item.nombre)}</span><br>
                <small>S/ ${item.precio} x </small>
                <input type="number" min="1" class="form-control d-inline-block cantidad-input" data-idx="${idx}" value="${item.cantidad}" style="width:70px;display:inline-block;">
            </div>
            <div>
                <button class="btn btn-sm btn-danger btn-eliminar" data-idx="${idx}"><i class="bi bi-trash"></i></button>
            </div>
        </li>`;
    });
    html += '</ul>';
    html += `<div class="text-end fw-bold">Total: S/ ${carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)}</div>`;
    cont.innerHTML = html;
    // Evento para cambiar cantidad
    cont.querySelectorAll('.cantidad-input').forEach(input => {
        input.addEventListener('change', function() {
            const idx = parseInt(this.dataset.idx);
            let val = parseInt(this.value);
            if (isNaN(val) || val < 1) val = 1;
            carrito[idx].cantidad = val;
            guardarCarrito();
            renderCarrito();
        });
    });
    // Evento eliminar
    cont.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.idx);
            carrito.splice(idx, 1);
            guardarCarrito();
            renderCarrito();
        });
    });
}

document.getElementById('cartBtn').addEventListener('click', function() {
    renderCarrito();
    const modal = new bootstrap.Modal(document.getElementById('modalCarrito'));
    modal.show();
});

document.getElementById('btnVaciarCarrito').addEventListener('click', function() {
    carrito = [];
    guardarCarrito();
    renderCarrito();
});

document.getElementById('btnEnviarWhatsapp').addEventListener('click', function() {
    if (carrito.length === 0) return;
    let mensaje = '¡Hola! Quiero pedir lo siguiente:%0A';
    carrito.forEach(item => {
        mensaje += `• ${item.nombre} %0A(S/ ${item.precio} x ${item.cantidad} UND)%0A`;
    });
    mensaje += `%0ATotal: S/ ${carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)}`;
    window.open(`https://wa.me/${phone}?text=${mensaje}`, '_blank');
});

// --- PAYPAL PAYMENT INTEGRATION ---
function initPayPalButton() {
    if (typeof paypal === 'undefined') {
        console.warn('PayPal SDK no cargado');
        return;
    }

    paypal.Buttons({
        createOrder: function(data, actions) {
            if (carrito.length === 0) {
                alert('El carrito está vacío');
                return;
            }

            const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: total.toFixed(2),
                        currency_code: 'USD' // PayPal maneja USD, conversión automática
                    },
                    description: `Compra en eDark - ${carrito.length} producto(s)`
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                // Pago exitoso
                alert(`¡Pago exitoso! Gracias por tu compra, ${details.payer.name.given_name}.`);

                // Guardar la venta en Firestore
                guardarVentaPayPal(details);

                // Limpiar carrito
                carrito = [];
                guardarCarrito();
                renderCarrito();

                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalCarrito'));
                if (modal) modal.hide();
            });
        },
        onError: function(err) {
            console.error('Error en PayPal:', err);
            alert('Hubo un error procesando el pago. Por favor intenta de nuevo.');
        }
    }).render('#paypal-button-container');
}

function guardarVentaPayPal(details) {
    const venta = {
        productos: carrito.map(item => ({
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad,
            subtotal: item.precio * item.cantidad
        })),
        total: carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
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

// Inicializar PayPal cuando se abre el modal del carrito
document.getElementById('cartBtn').addEventListener('click', function() {
    // Pequeño delay para asegurar que el modal se renderice
    setTimeout(() => {
        initPayPalButton();
    }, 100);
});

// --- AGREGAR AL CARRITO DESDE EL MODAL ---
document.getElementById('btnAgregarAlCarritoModal').addEventListener('click', function() {
    const nombre = document.getElementById('detalleNombre').textContent;
    const precio = parseFloat(document.getElementById('detallePrecio').textContent);
    const imagen = document.getElementById('detalleImagen').src;
    // Buscar en productosCache el producto exacto
    const producto = productosCache.find(p => sanitize(p.nombre) === nombre && p.precio == precio);
    if (!producto) return;
    const idx = carrito.findIndex(item => item.nombre === producto.nombre && item.precio === producto.precio);
    if (idx >= 0) {
        carrito[idx].cantidad++;
    } else {
        carrito.push({
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: 1
        });
    }
    guardarCarrito();
    // Opcional: cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetallesProducto'));
    if (modal) modal.hide();
});

document.addEventListener('DOMContentLoaded', function() {
    actualizarContadorCarrito();
});
// --- CARRUSEL DINÁMICO ---
document.addEventListener('DOMContentLoaded', function() {
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
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.02)';
                this.style.boxShadow = '0 15px 35px rgba(0, 123, 255, 0.3)';
            });

            card.addEventListener('mouseleave', function() {
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
// Modo oscuro: delegar totalmente a dark-mode.html (sin duplicaciones)
