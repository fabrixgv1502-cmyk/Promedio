"use strict"

/* =========================================================
   Configuración
   (los datos de carreras están en data.js → carrerasISIL)
   ========================================================= */
const NOTA_APROBATORIA = 13
const PESOS = [0.15, 0.15, 0.15, 0.15, 0.40]
const CREDITOS = [3, 4, 5, 6, 7, 8, 9, 10]
const STORAGE_KEY = "promedio-isil:v2"
const THEME_KEY = "promedio-isil:theme"

const AREAS = [
    { id: "Área de Diseño", key: "diseno", corto: "Diseño", icon: "bi-palette-fill" },
    { id: "Área de Comunicación", key: "comunicacion", corto: "Comunicación", icon: "bi-camera-reels-fill" },
    { id: "Área de Marketing", key: "marketing", corto: "Marketing", icon: "bi-megaphone-fill" },
    { id: "Área de Negocios", key: "negocios", corto: "Negocios", icon: "bi-briefcase-fill" },
    { id: "Área de Tecnología", key: "tecnologia", corto: "Tecnología", icon: "bi-cpu-fill" },
    { id: "Área de Servicios", key: "servicios", corto: "Servicios", icon: "bi-cup-hot-fill" }
]

const MODOS = {
    ponderado: {
        titulo: "Promedio ponderado del ciclo",
        corto: "Ponderado del ciclo",
        desc: "Ingresa los créditos y las 5 notas de cada curso. El resultado se actualiza al instante.",
        icon: "bi-calculator"
    },
    curso: {
        titulo: "Promedio de un curso",
        corto: "Un solo curso",
        desc: "Ingresa tus notas. Si aún no tienes la Nota 5, te decimos cuánto necesitas para aprobar.",
        icon: "bi-bullseye"
    },
    directo: {
        titulo: "Ponderado con notas finales",
        corto: "Notas finales",
        desc: "Ingresa los créditos y la nota final de cada curso para obtener tu promedio ponderado.",
        icon: "bi-clipboard2-data"
    }
}


/* =========================================================
   Utilidades
   ========================================================= */
const $ = (sel, el = document) => el.querySelector(sel)
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel))

const esc = s => String(s).replace(/[&<>"']/g, ch => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
))

const r2 = x => Math.round((x + Number.EPSILON) * 100) / 100
const fmt = x => r2(x).toFixed(2)
const fmtNota = x => Number.isInteger(x) ? String(x) : String(r2(x))
const redondearISIL = x => Math.round(r2(x))
const normalizar = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const plural = (n, uno, varios) => n === 1 ? uno : varios

let contadorId = 0
const nuevoId = () => "c" + Date.now().toString(36) + (contadorId++).toString(36)

function areaDe(nombreArea){
    return AREAS.find(a => a.id === nombreArea) || AREAS[0]
}

/* Devuelve: null = vacío, NaN = inválido, número = válido (0–20) */
function parseNota(valor){
    const s = String(valor ?? "").trim().replace(",", ".")
    if(s === "") return null
    if(!/^\d{1,2}(\.\d{1,2})?$/.test(s) && !/^\d{1,2}\.$/.test(s)) return NaN
    const n = parseFloat(s)
    if(n < 0 || n > 20) return NaN
    return n
}


/* =========================================================
   Estado + persistencia
   ========================================================= */
function cursoVacio(modo){
    if(modo === "directo") return { id: nuevoId(), nombre: "", creditos: "", final: "" }
    return { id: nuevoId(), nombre: "", creditos: "", notas: ["", "", "", "", ""] }
}

function datosIniciales(modo){
    if(modo === "curso") return [cursoVacio("curso")]
    return [cursoVacio(modo), cursoVacio(modo)]
}

function estadoInicial(){
    return {
        paso: 1,
        carrera: "",
        filtroArea: "todas",
        modo: "",
        datos: {
            ponderado: datosIniciales("ponderado"),
            curso: datosIniciales("curso"),
            directo: datosIniciales("directo")
        }
    }
}

function cargar(){
    const base = estadoInicial()
    try{
        const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY))
        if(guardado && typeof guardado === "object"){
            const s = { ...base, ...guardado, datos: { ...base.datos, ...(guardado.datos || {}) } }
            if(s.carrera && !carrerasISIL[s.carrera]) s.carrera = ""
            if(s.modo && !MODOS[s.modo]) s.modo = ""
            for(const m of Object.keys(MODOS)){
                if(!Array.isArray(s.datos[m]) || s.datos[m].length === 0) s.datos[m] = datosIniciales(m)
            }
            return s
        }
    }catch(e){ /* almacenamiento no disponible */ }
    return base
}

function guardar(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }catch(e){ /* ignorar */ }
}

let state = cargar()
let busqueda = ""


/* =========================================================
   Cálculos
   ========================================================= */
function notaMinimaN5(avance){
    const requerida = (NOTA_APROBATORIA - 0.5 - avance) / PESOS[4]
    if(requerida <= 0) return { estado: "asegurado", valor: 0 }
    if(requerida > 20) return { estado: "imposible", valor: null }
    return { estado: "posible", valor: Math.ceil(r2(requerida) * 2) / 2 }
}

function evaluarCurso(c){
    const n = c.notas.map(parseNota)
    const llenas = n.filter(x => x !== null && !Number.isNaN(x)).length

    if(n.some(x => Number.isNaN(x))) return { tipo: "invalido", llenas }

    const primeras = n.slice(0, 4)
    if(primeras.some(x => x === null)) return { tipo: "incompleto", llenas }

    const avance = primeras.reduce((s, x, i) => s + x * PESOS[i], 0)
    const necesaria = notaMinimaN5(avance)

    if(n[4] === null) return { tipo: "pendiente", llenas, avance, necesaria }

    const exacto = r2(avance + n[4] * PESOS[4])
    const final = redondearISIL(exacto)

    return {
        tipo: "completo", llenas, avance, necesaria, exacto, final,
        notas: n,
        aprobado: final >= NOTA_APROBATORIA
    }
}

function evaluarDirecto(c){
    const f = parseNota(c.final)
    if(f === null) return { tipo: "incompleto", llenas: 0 }
    if(Number.isNaN(f)) return { tipo: "invalido", llenas: 0 }
    return { tipo: "completo", exacto: f, final: f, aprobado: redondearISIL(f) >= NOTA_APROBATORIA }
}

function evaluar(c, modo = state.modo){
    return modo === "directo" ? evaluarDirecto(c) : evaluarCurso(c)
}

function resumenPonderado(lista, modo){
    const filas = lista.map((c, i) => {
        const cr = parseInt(c.creditos, 10)
        return {
            c,
            i,
            ev: evaluar(c, modo),
            creditos: Number.isFinite(cr) ? cr : null,
            nombre: c.nombre.trim() || `Curso ${i + 1}`
        }
    })

    const incluidos = filas.filter(f => f.ev.tipo === "completo" && f.creditos)
    const sumaCreditos = incluidos.reduce((s, f) => s + f.creditos, 0)
    const sumaPonderada = r2(incluidos.reduce((s, f) => s + f.ev.final * f.creditos, 0))
    const promedio = sumaCreditos ? r2(sumaPonderada / sumaCreditos) : null

    return {
        filas,
        incluidos,
        sumaCreditos,
        sumaPonderada,
        promedio,
        redondeado: promedio === null ? null : redondearISIL(promedio),
        creditosTotales: filas.reduce((s, f) => s + (f.creditos || 0), 0),
        aprobados: incluidos.filter(f => f.ev.aprobado).length,
        desaprobados: incluidos.filter(f => !f.ev.aprobado).length,
        creditosAprobados: incluidos.filter(f => f.ev.aprobado).reduce((s, f) => s + f.creditos, 0),
        pendientes: filas.length - incluidos.length,
        porN5: filas.filter(f => f.ev.tipo === "pendiente")
    }
}


/* =========================================================
   Navegación
   ========================================================= */
function pasoAlcanzable(paso){
    if(paso === 1) return true
    if(paso === 2) return !!state.carrera
    if(paso === 3) return !!(state.carrera && state.modo)
    return false
}

function irA(paso, { push = true, scroll = true } = {}){
    while(!pasoAlcanzable(paso)) paso--
    const cambio = paso !== state.paso
    state.paso = paso
    guardar()
    render()
    if(push && cambio) history.pushState({ paso }, "")
    if(scroll) window.scrollTo({ top: 0, behavior: "smooth" })
}

window.addEventListener("popstate", e => {
    irA((e.state && e.state.paso) || 1, { push: false })
})


/* =========================================================
   Render general
   ========================================================= */
function render(){
    $$(".view").forEach(v => { v.hidden = Number(v.dataset.view) !== state.paso })
    document.body.dataset.paso = state.paso

    renderStepper()

    if(state.paso === 1) renderCarreras()
    if(state.paso === 2) renderModos()
    if(state.paso === 3) renderTrabajo()
}

function renderStepper(){
    const carrera = carrerasISIL[state.carrera]
    const info = {
        1: carrera ? carrera.nombre : "Elige tu carrera",
        2: state.modo ? MODOS[state.modo].corto : "Elige un método",
        3: "Ingresa tus notas"
    }

    $$(".step").forEach(b => {
        const n = Number(b.dataset.step)
        const activo = n === state.paso
        b.disabled = !pasoAlcanzable(n)
        b.classList.toggle("is-active", activo)
        b.classList.toggle("is-done", !activo && pasoAlcanzable(n + 1) && n < 3)
        if(activo) b.setAttribute("aria-current", "step")
        else b.removeAttribute("aria-current")
        $("small", b).textContent = info[n]
    })
}

function pintarContexto(sufijo){
    const carrera = carrerasISIL[state.carrera]
    if(!carrera) return
    const area = areaDe(carrera.area)
    $("#ctxCarrera" + sufijo).textContent = carrera.nombre
    const icono = $("#ctxIcono" + sufijo)
    icono.style.setProperty("--area", `var(--area-${area.key})`)
    icono.innerHTML = `<i class="bi ${area.icon}"></i>`
}


/* =========================================================
   Paso 1 · Carreras
   ========================================================= */
function listaCarreras(){
    return Object.entries(carrerasISIL).map(([codigo, c]) => ({ codigo, ...c }))
}

function renderChips(){
    const todas = listaCarreras()
    const chips = [{ id: "todas", corto: "Todas", icon: "bi-grid-fill", total: todas.length }]
        .concat(AREAS.map(a => ({ ...a, total: todas.filter(c => c.area === a.id).length })))

    $("#areaChips").innerHTML = chips.map(a => `
        <button type="button" class="chip ${state.filtroArea === a.id ? "is-active" : ""}"
            data-area="${esc(a.id)}" aria-pressed="${state.filtroArea === a.id}"
            ${a.key ? `style="--chip-color: var(--area-${a.key})"` : ""}>
            <i class="bi ${a.icon}"></i>${esc(a.corto)} <small>${a.total}</small>
        </button>
    `).join("")
}

function renderCarreras(){
    renderChips()

    const q = normalizar(busqueda.trim())
    const lista = listaCarreras()
        .filter(c => state.filtroArea === "todas" || c.area === state.filtroArea)
        .filter(c => !q || normalizar(c.nombre).includes(q) || normalizar(c.area).includes(q))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }))

    $("#listaCarreras").innerHTML = lista.map(c => {
        const area = areaDe(c.area)
        const sel = c.codigo === state.carrera
        return `
            <button type="button" class="career ${sel ? "is-selected" : ""}" data-carrera="${c.codigo}"
                style="--area: var(--area-${area.key})">
                <span class="career-icon"><i class="bi ${area.icon}"></i></span>
                <span class="career-text">
                    <strong>${esc(c.nombre)}</strong>
                    <small>${area.corto} · ${c.cursos.length} cursos</small>
                </span>
                <i class="bi ${sel ? "bi-check-circle-fill" : "bi-chevron-right"} career-go"></i>
            </button>
        `
    }).join("")

    $("#sinResultados").hidden = lista.length > 0
    return lista
}

function elegirCarrera(codigo){
    state.carrera = codigo
    guardar()
    irA(2)
}


/* =========================================================
   Paso 2 · Métodos
   ========================================================= */
function renderModos(){
    pintarContexto("2")
    $$(".mode-card").forEach(card => {
        card.classList.toggle("is-selected", card.dataset.mode === state.modo)
    })
}

function elegirModo(modo){
    state.modo = modo
    guardar()
    irA(3)
}


/* =========================================================
   Paso 3 · Ingreso de notas
   ========================================================= */
function renderTrabajo(){
    const m = MODOS[state.modo]
    pintarContexto("3")

    $("#ctxModo").innerHTML = `<i class="bi ${m.icon}"></i> ${m.corto}`
    $("#tituloModo").innerHTML = `<i class="bi ${m.icon}"></i> ${m.titulo}`
    $("#descModo").textContent = m.desc
    $("#btnAgregar").hidden = state.modo === "curso"
    $("#btnLimpiar").innerHTML = `<i class="bi bi-arrow-counterclockwise"></i> ${state.modo === "curso" ? "Limpiar notas" : "Limpiar todo"}`

    const cursos = carrerasISIL[state.carrera].cursos.slice()
        .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
    $("#cursosCarrera").innerHTML = cursos.map(c => `<option value="${esc(c)}"></option>`).join("")

    renderLista()
}

function listaActual(){
    return state.datos[state.modo]
}

function buscarCurso(id){
    return listaActual().find(c => c.id === id)
}

function tplCreditos(c){
    return `
        <label class="credits">
            <span class="sr-only">Créditos</span>
            <select data-field="creditos" aria-label="Créditos">
                <option value="">Créditos</option>
                ${CREDITOS.map(n => `<option value="${n}" ${String(c.creditos) === String(n) ? "selected" : ""}>${n} créditos</option>`).join("")}
            </select>
        </label>
    `
}

function tplEliminar(i, total){
    if(state.modo === "curso" || total <= 1) return ""
    return `
        <button type="button" class="icon-btn icon-btn-danger" data-remove
            aria-label="Eliminar curso ${i + 1}" title="Eliminar curso">
            <i class="bi bi-trash3"></i>
        </button>
    `
}

function tplCurso(c, i, total){
    const notas = c.notas.map((v, k) => {
        const pct = Math.round(PESOS[k] * 100)
        return `
            <label class="grade ${k === 4 ? "grade-major" : ""}">
                <span class="grade-label">N${k + 1}<em>${pct}%</em></span>
                <input class="grade-input" type="text" inputmode="decimal" autocomplete="off" maxlength="5"
                    data-nota="${k}" value="${esc(v)}" placeholder="—" aria-label="Nota ${k + 1} (${pct}%)">
            </label>
        `
    }).join("")

    return `
        <article class="course" data-id="${c.id}" data-estado="idle">
            <div class="course-head">
                <span class="course-index">${i + 1}</span>
                <input class="course-name" type="text" list="cursosCarrera" autocomplete="off" data-field="nombre"
                    value="${esc(c.nombre)}" placeholder="Busca o escribe el curso" aria-label="Nombre del curso ${i + 1}">
                ${state.modo === "ponderado" ? tplCreditos(c) : ""}
                ${tplEliminar(i, total)}
            </div>
            <div class="grades">${notas}</div>
            <div class="course-foot" data-foot></div>
        </article>
    `
}

function tplDirecto(c, i, total){
    return `
        <article class="course course-compact" data-id="${c.id}" data-estado="idle">
            <div class="course-head">
                <span class="course-index">${i + 1}</span>
                <input class="course-name" type="text" list="cursosCarrera" autocomplete="off" data-field="nombre"
                    value="${esc(c.nombre)}" placeholder="Busca o escribe el curso" aria-label="Nombre del curso ${i + 1}">
                ${tplCreditos(c)}
                <label class="final-field">
                    <span>Nota final</span>
                    <input class="final-input" type="text" inputmode="decimal" autocomplete="off" maxlength="5"
                        data-field="final" value="${esc(c.final)}" placeholder="0–20" aria-label="Nota final del curso ${i + 1}">
                </label>
                ${tplEliminar(i, total)}
            </div>
            <div class="course-foot" data-foot></div>
        </article>
    `
}

function renderLista(){
    const lista = listaActual()
    $("#listaCursos").innerHTML = lista
        .map((c, i) => state.modo === "directo" ? tplDirecto(c, i, lista.length) : tplCurso(c, i, lista.length))
        .join("")
    lista.forEach(actualizarTarjeta)
    actualizarResultados()
}

function puntos(llenas){
    let html = ""
    for(let i = 0; i < 5; i++) html += `<i class="${i < llenas ? "on" : ""}"></i>`
    return `<span class="dots" aria-label="${llenas} de 5 notas">${html}</span>`
}

function estadoVisual(ev){
    if(ev.tipo === "invalido") return "error"
    if(ev.tipo === "incompleto") return "idle"
    if(ev.tipo === "pendiente") return ev.necesaria.estado === "asegurado" ? "ok" : ev.necesaria.estado === "imposible" ? "bad" : "pending"
    return ev.aprobado ? "ok" : "bad"
}

function textoEstado(ev, faltanCreditos){
    let html = ""

    if(ev.tipo === "invalido"){
        html = `<i class="bi bi-exclamation-octagon-fill"></i><span>Las notas deben ser números entre 0 y 20.</span>`
    }
    else if(ev.tipo === "incompleto"){
        html = state.modo === "directo"
            ? `<i class="bi bi-pencil"></i><span>Ingresa la nota final del curso.</span>`
            : `${puntos(ev.llenas)}<span>Completa N1 a N4 para saber cuánto necesitas en la N5.</span>`
    }
    else if(ev.tipo === "pendiente"){
        const n = ev.necesaria
        if(n.estado === "asegurado") html = `<i class="bi bi-emoji-smile-fill"></i><span>¡Ya aseguraste el curso! Apruebas incluso con 0 en la N5.</span>`
        else if(n.estado === "imposible") html = `<i class="bi bi-emoji-frown-fill"></i><span>Aunque saques 20 en la N5 no llegarías a 13.</span>`
        else html = `<i class="bi bi-bullseye"></i><span>Necesitas <b class="big">${fmtNota(n.valor)}</b> o más en la N5 para aprobar.</span>`
    }
    else{
        html = `
            <span class="pill ${ev.aprobado ? "pill-ok" : "pill-bad"}">
                <i class="bi ${ev.aprobado ? "bi-check-circle-fill" : "bi-x-circle-fill"}"></i>
                ${ev.aprobado ? "Aprobado" : "Desaprobado"}
            </span>
            <span>Nota final <b class="big">${fmtNota(ev.final)}</b>
            ${state.modo !== "directo" ? `<small>(${fmt(ev.exacto)} sin redondear)</small>` : ""}</span>
        `
    }

    if(faltanCreditos) html += `<span class="warn"><i class="bi bi-exclamation-triangle-fill"></i>Elige los créditos</span>`

    return html
}

function actualizarTarjeta(c){
    const card = $(`.course[data-id="${c.id}"]`)
    if(!card) return

    const ev = evaluar(c)

    if(state.modo === "directo"){
        $('[data-field="final"]', card).classList.toggle("is-invalid", Number.isNaN(parseNota(c.final)))
    }else{
        c.notas.forEach((v, k) => {
            $(`[data-nota="${k}"]`, card).classList.toggle("is-invalid", Number.isNaN(parseNota(v)))
        })
        const n5 = $('[data-nota="4"]', card)
        n5.placeholder = ev.tipo === "pendiente" && ev.necesaria.estado === "posible"
            ? "≥ " + fmtNota(ev.necesaria.valor)
            : "—"
    }

    const faltanCreditos = state.modo !== "curso" && !c.creditos && ev.tipo !== "incompleto"
    const sel = $('select[data-field="creditos"]', card)
    if(sel) sel.classList.toggle("is-missing", faltanCreditos)

    card.dataset.estado = estadoVisual(ev)
    $("[data-foot]", card).innerHTML = textoEstado(ev, faltanCreditos)
}


/* =========================================================
   Resultados en vivo
   ========================================================= */
function gauge(valor, tono, etiqueta, sub){
    const C = 2 * Math.PI * 52
    const pct = valor === null ? 0 : Math.max(0, Math.min(1, valor / 20))
    const ang = (NOTA_APROBATORIA / 20) * 2 * Math.PI
    const mx = (60 + 52 * Math.cos(ang)).toFixed(2)
    const my = (60 + 52 * Math.sin(ang)).toFixed(2)

    return `
        <div class="gauge tone-${tono} ${valor === null ? "is-empty" : ""}">
            <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle class="gauge-track" cx="60" cy="60" r="52"/>
                <circle class="gauge-bar" cx="60" cy="60" r="52"
                    stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${(C * (1 - pct)).toFixed(2)}"/>
                <circle class="gauge-mark" cx="${mx}" cy="${my}" r="3.5"/>
            </svg>
            <div class="gauge-center">
                <span class="gauge-value">${etiqueta}</span>
                <span class="gauge-sub">${sub}</span>
            </div>
        </div>
        <div class="gauge-legend"><i></i>Marca de aprobación: 13</div>
    `
}

function actualizarResultados(){
    if(state.paso !== 3) return
    if(state.modo === "curso") renderResumenCurso()
    else renderResumenPonderado()
    actualizarMobileBar()
}

function renderResumenPonderado(){
    const R = resumenPonderado(listaActual(), state.modo)
    const box = $("#resumen")

    if(R.promedio === null){
        box.innerHTML = `
            <div class="summary-empty">
                ${gauge(null, "primary", "—", "sin datos aún")}
                <h3>Tu promedio aparecerá aquí</h3>
                <p>${state.modo === "directo"
                    ? "Ingresa los créditos y la nota final de al menos un curso."
                    : "Completa los créditos y las 5 notas de al menos un curso."}</p>
            </div>
            ${tplNecesidades(R)}
        `
        $("#detalle").hidden = true
        return
    }

    const tono = R.redondeado >= NOTA_APROBATORIA ? "ok" : "bad"
    const parcial = R.pendientes > 0

    box.innerHTML = `
        <div class="summary-top">
            <span class="summary-kicker">${parcial ? "Promedio parcial" : "Promedio ponderado"}</span>
            ${parcial
                ? `<span class="pill pill-pending"><i class="bi bi-hourglass-split"></i>${R.incluidos.length} de ${R.filas.length} cursos</span>`
                : `<span class="pill pill-${tono}"><i class="bi bi-patch-check-fill"></i>Final</span>`}
        </div>

        ${gauge(R.promedio, tono, fmt(R.promedio), `Redondeado: <b>${R.redondeado}</b>`)}

        <div class="stats">
            <div class="stat ok"><strong>${R.aprobados}</strong><span>${plural(R.aprobados, "Aprobado", "Aprobados")}</span></div>
            <div class="stat bad"><strong>${R.desaprobados}</strong><span>${plural(R.desaprobados, "Desaprobado", "Desaprobados")}</span></div>
            <div class="stat"><strong>${R.creditosTotales}</strong><span>Créditos totales</span></div>
            <div class="stat"><strong>${R.creditosAprobados}</strong><span>Créditos aprobados</span></div>
        </div>

        ${tplNecesidades(R)}

        <button type="button" class="btn btn-ghost btn-block" data-copy>
            <i class="bi bi-clipboard"></i> Copiar resumen
        </button>
    `

    renderDetalle(R)
}

function tplNecesidades(R){
    if(!R.porN5.length) return ""
    return `
        <div class="needs">
            <h4><i class="bi bi-bullseye"></i> Lo que necesitas en la N5</h4>
            <ul>
                ${R.porN5.map(f => {
                    const n = f.ev.necesaria
                    const txt = n.estado === "asegurado" ? "Ya aprobado" : n.estado === "imposible" ? "No alcanza" : "≥ " + fmtNota(n.valor)
                    return `<li><span>${esc(f.nombre)}</span><b>${txt}</b></li>`
                }).join("")}
            </ul>
        </div>
    `
}

function renderDetalle(R){
    const det = $("#detalle")
    const conNotas = state.modo === "ponderado"

    const filas = R.filas.map(f => {
        const ok = f.ev.tipo === "completo"
        const incluido = ok && f.creditos
        let estado

        if(ok) estado = `<span class="pill ${f.ev.aprobado ? "pill-ok" : "pill-bad"}">${f.ev.aprobado ? "Aprobado" : "Desaprobado"}</span>`
        else if(f.ev.tipo === "pendiente") estado = `<span class="pill pill-pending">Falta N5</span>`
        else if(f.ev.tipo === "invalido") estado = `<span class="pill pill-bad">Revisar</span>`
        else estado = `<span class="pill pill-idle">Incompleto</span>`

        if(ok && !f.creditos) estado = `<span class="pill pill-pending">Faltan créditos</span>`

        return `
            <tr class="${incluido ? "" : "is-muted"}">
                <td>${esc(f.nombre)}</td>
                <td class="num">${f.creditos ?? "—"}</td>
                ${conNotas ? `<td class="num">${ok ? fmt(f.ev.exacto) : "—"}</td>` : ""}
                <td class="num"><b>${ok ? fmtNota(f.ev.final) : "—"}</b></td>
                <td class="num">${incluido ? fmtNota(r2(f.ev.final * f.creditos)) : "—"}</td>
                <td>${estado}</td>
            </tr>
        `
    }).join("")

    const terminos = R.incluidos.map(f => `${fmtNota(f.ev.final)}×${f.creditos}`).join(" + ")
    const creditos = R.incluidos.map(f => f.creditos).join(" + ")

    det.innerHTML = `
        <div class="detail-head">
            <h3><i class="bi bi-table"></i> Detalle del cálculo</h3>
        </div>

        <div class="table-wrap">
            <table class="tbl">
                <thead>
                    <tr>
                        <th>Curso</th>
                        <th class="num">Créditos</th>
                        ${conNotas ? `<th class="num">Sin redondear</th>` : ""}
                        <th class="num">Nota final</th>
                        <th class="num">Nota × créditos</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
                <tfoot>
                    <tr>
                        <td>Total considerado</td>
                        <td class="num">${R.sumaCreditos}</td>
                        ${conNotas ? "<td></td>" : ""}
                        <td></td>
                        <td class="num">${fmtNota(R.sumaPonderada)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <div class="formula">
            <div class="formula-label">Fórmula aplicada${R.pendientes ? " (solo cursos completos)" : ""}</div>
            <div class="formula-math">
                <span class="frac"><span>Σ (nota × créditos)</span><span>Σ créditos</span></span>
                <span class="eq">=</span>
                <span class="frac"><span>${terminos}</span><span>${creditos}</span></span>
                <span class="eq">=</span>
                <span class="frac"><span>${fmtNota(R.sumaPonderada)}</span><span>${R.sumaCreditos}</span></span>
                <span class="eq">=</span>
                <span class="res">${fmt(R.promedio)}</span>
                <span class="eq">→</span>
                <span class="res">${R.redondeado}</span>
            </div>
        </div>
    `
    det.hidden = false
}

function renderResumenCurso(){
    const c = state.datos.curso[0]
    const ev = evaluarCurso(c)
    const box = $("#resumen")
    $("#detalle").hidden = true

    if(ev.tipo === "invalido" || ev.tipo === "incompleto"){
        box.innerHTML = `
            <div class="summary-empty">
                ${gauge(null, "primary", "—", `${ev.llenas} de 5 notas`)}
                <h3>${ev.tipo === "invalido" ? "Revisa tus notas" : "Ingresa tus notas"}</h3>
                <p>${ev.tipo === "invalido"
                    ? "Cada nota debe ser un número entre 0 y 20."
                    : "Con N1 a N4 te diremos cuánto necesitas en la N5. Con las 5, tu nota final."}</p>
            </div>
        `
        return
    }

    if(ev.tipo === "pendiente"){
        const n = ev.necesaria
        const tono = n.estado === "asegurado" ? "ok" : n.estado === "imposible" ? "bad" : "pending"
        const etiqueta = n.estado === "imposible" ? "&gt;20" : fmtNota(n.valor)
        const sub = n.estado === "asegurado" ? "¡ya aprobaste!" : n.estado === "imposible" ? "no alcanza" : "mínimo en la N5"
        const inicio = n.estado === "posible" ? n.valor : 10

        box.innerHTML = `
            <div class="summary-top">
                <span class="summary-kicker">Necesitas en la N5</span>
                <span class="pill pill-${tono}">${n.estado === "posible" ? "Alcanzable" : n.estado === "asegurado" ? "Asegurado" : "Difícil"}</span>
            </div>

            ${gauge(n.estado === "imposible" ? 20 : n.valor, tono, etiqueta, sub)}

            <div class="kv">
                <div><span>Avance actual (N1–N4 = 60%)</span><b>${fmt(ev.avance)}</b></div>
                <div><span>Nota máxima posible</span><b>${redondearISIL(ev.avance + 20 * PESOS[4])}</b></div>
            </div>

            <div class="sim">
                <div class="sim-head">
                    <label for="simRange">Simula tu Nota 5</label>
                    <output id="simOut" for="simRange">${fmtNota(inicio)}</output>
                </div>
                <input type="range" id="simRange" min="0" max="20" step="0.5" value="${inicio}">
                <div class="sim-scale"><span>0</span><span>10</span><span>20</span></div>
                <div id="simResult"></div>
            </div>

            <button type="button" class="btn btn-ghost btn-block" data-copy>
                <i class="bi bi-clipboard"></i> Copiar resumen
            </button>
        `
        actualizarSimulador()
        return
    }

    const tono = ev.aprobado ? "ok" : "bad"
    box.innerHTML = `
        <div class="summary-top">
            <span class="summary-kicker">Nota final del curso</span>
            <span class="pill pill-${tono}">
                <i class="bi ${ev.aprobado ? "bi-check-circle-fill" : "bi-x-circle-fill"}"></i>
                ${ev.aprobado ? "Aprobado" : "Desaprobado"}
            </span>
        </div>

        ${gauge(ev.exacto, tono, String(ev.final), `${fmt(ev.exacto)} sin redondear`)}

        <div class="kv">
            ${ev.notas.map((x, k) => `
                <div><span>N${k + 1} · ${fmtNota(x)} × ${Math.round(PESOS[k] * 100)}%</span><b>${fmt(x * PESOS[k])}</b></div>
            `).join("")}
            <div><span><b>Total</b></span><b>${fmt(ev.exacto)} → ${ev.final}</b></div>
        </div>

        <button type="button" class="btn btn-ghost btn-block" data-copy>
            <i class="bi bi-clipboard"></i> Copiar resumen
        </button>
    `
}

function actualizarSimulador(){
    const range = $("#simRange")
    if(!range) return
    const ev = evaluarCurso(state.datos.curso[0])
    if(ev.tipo !== "pendiente") return

    const v = parseFloat(range.value)
    const exacto = r2(ev.avance + v * PESOS[4])
    const final = redondearISIL(exacto)
    const ok = final >= NOTA_APROBATORIA

    $("#simOut").textContent = fmtNota(v)
    $("#simResult").innerHTML = `
        <div class="sim-result ${ok ? "ok" : "bad"}">
            <i class="bi ${ok ? "bi-check-circle-fill" : "bi-x-circle-fill"}"></i>
            <span>Nota final <b>${final}</b> (${fmt(exacto)}) · ${ok ? "Aprobado" : "Desaprobado"}</span>
        </div>
    `
}

function actualizarMobileBar(){
    const t = $("#mobileBarText")
    if(state.paso !== 3){ t.innerHTML = ""; return }

    if(state.modo === "curso"){
        const ev = evaluarCurso(state.datos.curso[0])
        if(ev.tipo === "completo"){
            t.innerHTML = `Nota final <b>${ev.final}</b><span class="pill ${ev.aprobado ? "pill-ok" : "pill-bad"}">${ev.aprobado ? "Aprobado" : "Desaprobado"}</span>`
        }else if(ev.tipo === "pendiente"){
            const n = ev.necesaria
            t.innerHTML = n.estado === "posible"
                ? `Necesitas <b>${fmtNota(n.valor)}</b> en la N5`
                : n.estado === "asegurado" ? `<b>¡Ya aprobaste!</b>` : `<b>No alcanza</b> con la N5`
        }else{
            t.textContent = "Completa tus notas para ver el resultado"
        }
        return
    }

    const R = resumenPonderado(listaActual(), state.modo)
    if(R.promedio === null){
        t.textContent = "Completa un curso para ver tu promedio"
        return
    }
    const ok = R.redondeado >= NOTA_APROBATORIA
    t.innerHTML = `${R.pendientes ? "Parcial" : "Promedio"} <b>${fmt(R.promedio)}</b><span class="pill ${ok ? "pill-ok" : "pill-bad"}">${R.redondeado}</span>`
}


/* =========================================================
   Acciones
   ========================================================= */
function agregarCurso(){
    const lista = listaActual()
    const nuevo = cursoVacio(state.modo)
    lista.push(nuevo)
    guardar()
    renderLista()

    const card = $(`.course[data-id="${nuevo.id}"]`)
    if(card){
        card.scrollIntoView({ behavior: "smooth", block: "center" })
        $(".course-name", card).focus({ preventScroll: true })
    }
}

function eliminarCurso(id){
    const modo = state.modo
    const lista = state.datos[modo]
    const idx = lista.findIndex(c => c.id === id)
    if(idx < 0 || lista.length <= 1) return

    const [quitado] = lista.splice(idx, 1)
    guardar()
    renderLista()

    toast(`Se eliminó “${quitado.nombre.trim() || "Curso " + (idx + 1)}”`, "Deshacer", () => {
        state.datos[modo].splice(idx, 0, quitado)
        guardar()
        if(state.paso === 3 && state.modo === modo) renderLista()
    })
}

function limpiar(){
    const modo = state.modo
    const copia = JSON.parse(JSON.stringify(state.datos[modo]))

    if(modo === "curso"){
        state.datos.curso[0].notas = ["", "", "", "", ""]
    }else{
        state.datos[modo] = datosIniciales(modo)
    }
    guardar()
    renderLista()

    toast("Se limpiaron los datos", "Deshacer", () => {
        state.datos[modo] = copia
        guardar()
        if(state.paso === 3 && state.modo === modo) renderLista()
    })
}

function textoResumen(){
    const carrera = carrerasISIL[state.carrera]?.nombre || ""
    const lineas = [`Promedio ISIL — ${carrera}`, ""]

    if(state.modo === "curso"){
        const c = state.datos.curso[0]
        const ev = evaluarCurso(c)
        lineas.push(`Curso: ${c.nombre.trim() || "Sin nombre"}`)
        lineas.push(`Notas: ${c.notas.map((v, k) => `N${k + 1}=${v.trim() || "—"}`).join("  ")}`)
        if(ev.tipo === "completo") lineas.push(`Nota final: ${ev.final} (${fmt(ev.exacto)}) · ${ev.aprobado ? "Aprobado" : "Desaprobado"}`)
        if(ev.tipo === "pendiente"){
            const n = ev.necesaria
            lineas.push(n.estado === "posible" ? `Necesito ${fmtNota(n.valor)} en la N5 para aprobar.`
                : n.estado === "asegurado" ? "Ya aprobé, incluso con 0 en la N5." : "No alcanza aunque saque 20 en la N5.")
        }
        return lineas.join("\n")
    }

    const R = resumenPonderado(listaActual(), state.modo)
    R.filas.forEach(f => {
        let v = "incompleto"
        if(f.ev.tipo === "completo") v = `${fmtNota(f.ev.final)} (${f.ev.aprobado ? "aprobado" : "desaprobado"})`
        if(f.ev.tipo === "pendiente") v = f.ev.necesaria.estado === "posible" ? `falta N5 (necesito ${fmtNota(f.ev.necesaria.valor)})` : "falta N5"
        lineas.push(`• ${f.nombre}${f.creditos ? ` [${f.creditos} cr]` : ""}: ${v}`)
    })
    if(R.promedio !== null){
        lineas.push("", `Promedio ponderado${R.pendientes ? " parcial" : ""}: ${fmt(R.promedio)} → ${R.redondeado}`)
    }
    return lineas.join("\n")
}

async function copiarResumen(){
    const texto = textoResumen()
    try{
        await navigator.clipboard.writeText(texto)
        toast("Resumen copiado al portapapeles")
    }catch(e){
        const ta = document.createElement("textarea")
        ta.value = texto
        document.body.appendChild(ta)
        ta.select()
        let ok = false
        try{ ok = document.execCommand("copy") }catch(err){ ok = false }
        ta.remove()
        toast(ok ? "Resumen copiado al portapapeles" : "No se pudo copiar el resumen")
    }
}

let toastTimer
function toast(mensaje, accion, alHacerClic){
    const t = $("#toast")
    t.innerHTML = `<span>${esc(mensaje)}</span>${accion ? `<button type="button">${esc(accion)}</button>` : ""}`
    if(accion){
        $("button", t).addEventListener("click", () => {
            alHacerClic()
            t.classList.remove("show")
        }, { once: true })
    }
    t.classList.add("show")
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => t.classList.remove("show"), accion ? 6000 : 2600)
}


/* =========================================================
   Tema claro / oscuro
   ========================================================= */
function temaActual(){
    return document.documentElement.dataset.theme
        || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
}

function pintarIconoTema(){
    const oscuro = temaActual() === "dark"
    $("#themeToggle").innerHTML = `<i class="bi ${oscuro ? "bi-sun-fill" : "bi-moon-stars-fill"}"></i>`
    $("#themeToggle").setAttribute("aria-label", oscuro ? "Usar tema claro" : "Usar tema oscuro")
}

function alternarTema(){
    const siguiente = temaActual() === "dark" ? "light" : "dark"
    document.documentElement.dataset.theme = siguiente
    try{ localStorage.setItem(THEME_KEY, siguiente) }catch(e){ /* ignorar */ }
    pintarIconoTema()
}


/* =========================================================
   Eventos
   ========================================================= */
document.addEventListener("click", e => {
    const t = e.target

    const goto = t.closest("[data-goto]")
    if(goto){ irA(Number(goto.dataset.goto)); return }

    const step = t.closest(".step")
    if(step && !step.disabled){ irA(Number(step.dataset.step)); return }

    const carrera = t.closest("[data-carrera]")
    if(carrera){ elegirCarrera(carrera.dataset.carrera); return }

    const area = t.closest("[data-area]")
    if(area){
        state.filtroArea = area.dataset.area
        guardar()
        renderCarreras()
        return
    }

    const modo = t.closest("[data-mode]")
    if(modo){ elegirModo(modo.dataset.mode); return }

    if(t.closest("[data-copy]")){ copiarResumen(); return }

    const quitar = t.closest("[data-remove]")
    if(quitar){ eliminarCurso(quitar.closest(".course").dataset.id); return }
})

$("#themeToggle").addEventListener("click", alternarTema)
$("#btnAgregar").addEventListener("click", agregarCurso)
$("#btnLimpiar").addEventListener("click", limpiar)
$("#mobileBarBtn").addEventListener("click", () => {
    $("#resumen").scrollIntoView({ behavior: "smooth", block: "start" })
})

$("#buscarCarrera").addEventListener("input", e => {
    busqueda = e.target.value
    renderCarreras()
})

$("#buscarCarrera").addEventListener("keydown", e => {
    if(e.key !== "Enter") return
    const visibles = $$("#listaCarreras [data-carrera]")
    if(visibles.length === 1) elegirCarrera(visibles[0].dataset.carrera)
    else if(visibles.length) visibles[0].focus()
})

const listaCursosEl = $("#listaCursos")

listaCursosEl.addEventListener("input", e => {
    const t = e.target
    const card = t.closest(".course")
    if(!card) return
    const c = buscarCurso(card.dataset.id)
    if(!c) return

    if(t.dataset.nota !== undefined) c.notas[Number(t.dataset.nota)] = t.value
    else if(t.dataset.field) c[t.dataset.field] = t.value
    else return

    guardar()
    actualizarTarjeta(c)
    actualizarResultados()
})

listaCursosEl.addEventListener("keydown", e => {
    const t = e.target
    const esNota = t.matches(".grade-input, .final-input")

    if(e.key === "Enter" && t.matches("input")){
        e.preventDefault()
        const campos = $$("#listaCursos input, #listaCursos select")
        const sig = campos[campos.indexOf(t) + 1]
        if(sig) sig.focus()
        else if(state.modo !== "curso") agregarCurso()
        return
    }

    if(esNota && (e.key === "ArrowUp" || e.key === "ArrowDown")){
        e.preventDefault()
        const actual = parseNota(t.value)
        const base = actual === null || Number.isNaN(actual) ? (e.key === "ArrowUp" ? -0.5 : 20.5) : actual
        const nuevo = Math.max(0, Math.min(20, base + (e.key === "ArrowUp" ? 0.5 : -0.5)))
        t.value = fmtNota(nuevo)
        t.dispatchEvent(new Event("input", { bubbles: true }))
    }
})

listaCursosEl.addEventListener("focusin", e => {
    if(e.target.matches(".grade-input, .final-input")) e.target.select()
})

$("#resumen").addEventListener("input", e => {
    if(e.target.id === "simRange") actualizarSimulador()
})


/* =========================================================
   Inicio
   ========================================================= */
pintarIconoTema()
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", pintarIconoTema)

while(!pasoAlcanzable(state.paso)) state.paso--
history.replaceState({ paso: state.paso }, "")
render()
