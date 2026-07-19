// Crear opciones para notas de 0 a 20 con decimales
function opcionesNotas(){
    let opciones, i, valor

    opciones = `<option value="">Seleccione nota</option>`

    for(i = 0; i <= 40; i++){
        valor = (i * 0.5).toFixed(1)
        opciones = opciones + `<option value="${valor}">${valor}</option>`
    }

    return opciones
}


// Crear opciones para créditos de 3 a 10
function opcionesCreditos(){
    let opciones, i

    opciones = `<option value="">Seleccione créditos</option>`

    for(i = 3; i <= 10; i++){
        opciones = opciones + `<option value="${i}">${i}</option>`
    }

    return opciones
}


let modoActual = ""


// Seleccionar opción principal
function seleccionarModo(modo){
    modoActual = modo

    document.getElementById("resultado").innerHTML = ""
    document.getElementById("zonaCursos").innerHTML = ""
    document.getElementById("zonaCursoUnico").innerHTML = ""

    document.getElementById("panelPonderado").classList.add("d-none")
    document.getElementById("panelCurso").classList.add("d-none")
    document.getElementById("accionesPonderado").classList.add("d-none")
    document.getElementById("accionesCurso").classList.add("d-none")

    if(modoActual == "ponderado"){
        document.getElementById("panelPonderado").classList.remove("d-none")
        document.getElementById("accionesPonderado").classList.remove("d-none")
        document.getElementById("cantidadCursos").value = ""
        document.getElementById("cantidadCursos").focus()
    }

    if(modoActual == "curso"){
        document.getElementById("panelCurso").classList.remove("d-none")
        document.getElementById("accionesCurso").classList.remove("d-none")
        document.getElementById("cantidadCursos").value = ""
        generarCursoUnico()
    }
}


// Validar cantidad en opción ponderado
function validarCantidadPonderado(){
    let cantidad

    cantidad = parseInt(document.getElementById("cantidadCursos").value)

    if(cantidad == 1){
        seleccionarModo("curso")

        document.getElementById("resultado").innerHTML = `
            <div class="alerta-personalizada">
                <i class="bi bi-info-circle-fill"></i>
                Como ingresaste solo 1 curso, se activó automáticamente la opción de promedio de un solo curso.
            </div>
        `
    }
}


// Calcula la nota mínima necesaria en Nota 5 para aprobar con redondeo ISIL
function calcularNota5Minima(n1, n2, n3, n4){
    let sumaPrimerasNotas, notaNecesaria

    sumaPrimerasNotas = (n1 * 0.15) + (n2 * 0.15) + (n3 * 0.15) + (n4 * 0.15)

    // Para aprobar en ISIL se necesita llegar a 12.5 sin redondear
    notaNecesaria = (12.5 - sumaPrimerasNotas) / 0.40

    notaNecesaria = Math.ceil(notaNecesaria * 100) / 100

    if(notaNecesaria <= 0){
        return "0.00"
    }

    if(notaNecesaria > 20){
        return "No alcanza"
    }

    return notaNecesaria.toFixed(2)
}


// Generar formulario para un solo curso
function generarCursoUnico(){
    let contenido

    contenido = `
        <div class="row g-4 justify-content-center">

            <div class="col col-sm-12 col-md-10 col-lg-8">

                <div class="card curso-card">

                    <div class="card-body">

                        <h3 class="curso-titulo">
                            <i class="bi bi-journal-check"></i>
                            Datos del curso
                        </h3>

                        <div class="mb-3">
                            <label class="form-label">Nombre del curso</label>
                            <input type="text" id="cursoUnico" class="form-control" placeholder="Ejemplo: Matemática">
                        </div>

                        <div class="row g-3">

                            <div class="col-6">
                                <label class="form-label">Nota 1 - 15%</label>
                                <select id="u_n1" class="form-select">
                                    ${opcionesNotas()}
                                </select>
                            </div>

                            <div class="col-6">
                                <label class="form-label">Nota 2 - 15%</label>
                                <select id="u_n2" class="form-select">
                                    ${opcionesNotas()}
                                </select>
                            </div>

                            <div class="col-6">
                                <label class="form-label">Nota 3 - 15%</label>
                                <select id="u_n3" class="form-select">
                                    ${opcionesNotas()}
                                </select>
                            </div>

                            <div class="col-6">
                                <label class="form-label">Nota 4 - 15%</label>
                                <select id="u_n4" class="form-select">
                                    ${opcionesNotas()}
                                </select>
                            </div>

                            <div class="col-12">
                                <label class="form-label">Nota 5 - 40%</label>
                                <select id="u_n5" class="form-select">
                                    ${opcionesNotas()}
                                </select>
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    `

    document.getElementById("zonaCursoUnico").innerHTML = contenido
}


// Generar varios cursos
function generarCursos(){
    let cantidad, i, contenido

    cantidad = parseInt(document.getElementById("cantidadCursos").value)
    contenido = ""

    if(cantidad == 1){
        seleccionarModo("curso")

        document.getElementById("resultado").innerHTML = `
            <div class="alerta-personalizada">
                <i class="bi bi-info-circle-fill"></i>
                Para calcular solo 1 curso se activó automáticamente la opción 2.
            </div>
        `
        return
    }

    if(isNaN(cantidad) || cantidad < 2){
        document.getElementById("zonaCursos").innerHTML = ""
        document.getElementById("resultado").innerHTML = `
            <div class="alerta-personalizada">
                <i class="bi bi-exclamation-triangle-fill"></i>
                Para calcular el promedio ponderado debe ingresar mínimo 2 cursos.
            </div>
        `
        return
    }

    for(i = 1; i <= cantidad; i++){
        contenido = contenido + `
            <div class="col col-sm-12 col-md-6 col-lg-4">

                <div class="card curso-card">

                    <div class="card-body">

                        <h3 class="curso-titulo">
                            <i class="bi bi-journal-text"></i>
                            Curso ${i}
                        </h3>

                        <div class="mb-3">
                            <label class="form-label">Nombre del curso</label>
                            <input type="text" id="curso${i}" class="form-control" placeholder="Ejemplo: Matemática">
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Créditos</label>
                            <select id="creditos${i}" class="form-select">
                                ${opcionesCreditos()}
                            </select>
                        </div>

                        <div class="row g-3">

                            <div class="col-6">
                                <label class="form-label">Nota 1 - 15%</label>
                                <select id="n1_${i}" class="form-select">
                                    ${opcionesNotas()}
                                </select>
                            </div>

                            <div class="col-6">
                                <label class="form-label">Nota 2 - 15%</label>
                                <select id="n2_${i}" class="form-select">
                                    ${opcionesNotas()}
                                </select>
                            </div>

                            <div class="col-6">
                                <label class="form-label">Nota 3 - 15%</label>
                                <select id="n3_${i}" class="form-select">
                                    ${opcionesNotas()}
                                </select>
                            </div>

                            <div class="col-6">
                                <label class="form-label">Nota 4 - 15%</label>
                                <select id="n4_${i}" class="form-select">
                                    ${opcionesNotas()}
                                </select>
                            </div>

                            <div class="col-12">
                                <label class="form-label">Nota 5 - 40%</label>
                                <select id="n5_${i}" class="form-select">
                                    ${opcionesNotas()}
                                </select>
                            </div>

                        </div>

                    </div>

                </div>

            </div>
        `
    }

    document.getElementById("zonaCursos").innerHTML = contenido
    document.getElementById("resultado").innerHTML = ""
}


// Calcular promedio de un solo curso
function calcularCursoUnico(){
    let nombreCurso, n1, n2, n3, n4, n5
    let promedioDecimal, promedioCurso, estado
    let nota5Minima
    let promedioNotasIngresadas
    let avancePonderado

    nombreCurso = document.getElementById("cursoUnico").value

    n1 = parseFloat(document.getElementById("u_n1").value)
    n2 = parseFloat(document.getElementById("u_n2").value)
    n3 = parseFloat(document.getElementById("u_n3").value)
    n4 = parseFloat(document.getElementById("u_n4").value)
    n5 = parseFloat(document.getElementById("u_n5").value)

    if(nombreCurso == ""){
        nombreCurso = "Curso seleccionado"
    }

    if(isNaN(n1) || isNaN(n2) || isNaN(n3) || isNaN(n4)){
        document.getElementById("resultado").innerHTML = `
            <div class="alerta-personalizada">
                <i class="bi bi-exclamation-triangle-fill"></i>
                Complete las notas 1, 2, 3 y 4 para calcular la nota mínima necesaria en Nota 5.
            </div>
        `
        return
    }

    nota5Minima = calcularNota5Minima(n1, n2, n3, n4)

    promedioNotasIngresadas = (n1 + n2 + n3 + n4) / 4

    avancePonderado = (n1 * 0.15) + (n2 * 0.15) + (n3 * 0.15) + (n4 * 0.15)

    if(isNaN(n5)){
        document.getElementById("resultado").innerHTML = `
            <div class="resultado-curso">
                <h2>
                    <i class="bi bi-bullseye"></i>
                    Nota mínima necesaria
                </h2>

                <p class="fw-bold">${nombreCurso}</p>

                <div class="row g-3 mt-3">

                    <div class="col col-sm-12 col-md-6 col-lg-4">
                        <div class="resumen-card">
                            <i class="bi bi-bar-chart-fill text-primary"></i>
                            <div class="resumen-numero">${promedioNotasIngresadas.toFixed(2)}</div>
                            <div class="resumen-label">Promedio de notas ingresadas</div>
                        </div>
                    </div>

                    <div class="col col-sm-12 col-md-6 col-lg-4">
                        <div class="resumen-card">
                            <i class="bi bi-graph-up-arrow text-success"></i>
                            <div class="resumen-numero">${avancePonderado.toFixed(2)}</div>
                            <div class="resumen-label">Avance ponderado actual</div>
                        </div>
                    </div>

                    <div class="col col-sm-12 col-md-6 col-lg-4">
                        <div class="resumen-card">
                            <i class="bi bi-bullseye text-danger"></i>
                            <div class="resumen-numero">${nota5Minima}</div>
                            <div class="resumen-label">Nota 5 mínima para aprobar</div>
                        </div>
                    </div>

                </div>

                <div class="simulador-nota mt-4">
                    <h3>
                        <i class="bi bi-pencil-square"></i>
                        Simular una posible Nota 5
                    </h3>

                    <p>
                        Selecciona una nota del 0 al 20 y el sistema te dirá si aprobarías o desaprobarías con esa Nota 5.
                    </p>

                    <div class="row g-3 justify-content-center align-items-end">

                        <div class="col col-sm-12 col-md-6 col-lg-4">
                            <label class="form-label">Posible Nota 5</label>
                            <select id="nota5Simulada" class="form-select">
                                ${opcionesNotas()}
                            </select>
                        </div>

                        <div class="col col-sm-12 col-md-6 col-lg-4">
                            <button class="btn btn-primary w-100" onclick="evaluarNota5Simulada()">
                                <i class="bi bi-search"></i>
                                Evaluar nota
                            </button>
                        </div>

                    </div>

                    <div id="resultadoSimulacion" class="mt-3"></div>
                </div>

                <p class="mt-4">
                    Recuerda: ISIL redondea la nota final y se aprueba con 13.
                </p>
            </div>
        `
        return
    }

    promedioDecimal = (n1 * 0.15) + (n2 * 0.15) + (n3 * 0.15) + (n4 * 0.15) + (n5 * 0.40)

    promedioCurso = Math.round(promedioDecimal)

    if(promedioCurso >= 13){
        estado = "<span class='badge text-bg-success'>Aprobado</span>"
    }else{
        estado = "<span class='badge text-bg-danger'>Desaprobado</span>"
    }

    document.getElementById("resultado").innerHTML = `
        <div class="resultado-curso">
            <h2>
                <i class="bi bi-award-fill"></i>
                Resultado del curso
            </h2>

            <p class="fw-bold">${nombreCurso}</p>

            <div class="numero">${promedioCurso}</div>

            <p>Promedio sin redondear: ${promedioDecimal.toFixed(2)}</p>

            <p>Promedio de notas ingresadas: <strong>${promedioNotasIngresadas.toFixed(2)}</strong></p>

            <p>Nota 5 registrada: <strong>${n5}</strong></p>

            <p>Estado final: ${estado}</p>
        </div>
    `
}


// Evaluar una posible Nota 5 en la opción de un solo curso
function evaluarNota5Simulada(){
    let n1, n2, n3, n4, nota5Simulada
    let promedioDecimal, promedioISIL, mensaje, claseEstado

    n1 = parseFloat(document.getElementById("u_n1").value)
    n2 = parseFloat(document.getElementById("u_n2").value)
    n3 = parseFloat(document.getElementById("u_n3").value)
    n4 = parseFloat(document.getElementById("u_n4").value)
    nota5Simulada = parseFloat(document.getElementById("nota5Simulada").value)

    if(isNaN(nota5Simulada)){
        document.getElementById("resultadoSimulacion").innerHTML = `
            <div class="alert alert-warning text-center fw-bold">
                Seleccione una Nota 5 para simular.
            </div>
        `
        return
    }

    promedioDecimal = (n1 * 0.15) + (n2 * 0.15) + (n3 * 0.15) + (n4 * 0.15) + (nota5Simulada * 0.40)

    promedioISIL = Math.round(promedioDecimal)

    if(promedioISIL >= 13){
        mensaje = "Con esa Nota 5 estarías APROBADO."
        claseEstado = "simulacion-aprobado"
    }else{
        mensaje = "Con esa Nota 5 estarías DESAPROBADO."
        claseEstado = "simulacion-desaprobado"
    }

    document.getElementById("resultadoSimulacion").innerHTML = `
        <div class="resultado-simulacion ${claseEstado}">
            <h4>${mensaje}</h4>

            <p>Nota 5 simulada: <strong>${nota5Simulada}</strong></p>

            <p>Promedio sin redondear: <strong>${promedioDecimal.toFixed(2)}</strong></p>

            <p>Promedio final ISIL: <strong>${promedioISIL}</strong></p>
        </div>
    `
}


// Evaluar una posible Nota 5 en la opción de varios cursos
function evaluarNota5SimuladaCurso(numeroCurso){
    let n1, n2, n3, n4, nota5Simulada
    let promedioDecimal, promedioISIL, mensaje, claseEstado

    n1 = parseFloat(document.getElementById("n1_" + numeroCurso).value)
    n2 = parseFloat(document.getElementById("n2_" + numeroCurso).value)
    n3 = parseFloat(document.getElementById("n3_" + numeroCurso).value)
    n4 = parseFloat(document.getElementById("n4_" + numeroCurso).value)
    nota5Simulada = parseFloat(document.getElementById("nota5SimuladaCurso" + numeroCurso).value)

    if(isNaN(nota5Simulada)){
        document.getElementById("resultadoSimulacionCurso" + numeroCurso).innerHTML = `
            <div class="alert alert-warning text-center fw-bold">
                Seleccione una Nota 5 para simular.
            </div>
        `
        return
    }

    promedioDecimal = (n1 * 0.15) + (n2 * 0.15) + (n3 * 0.15) + (n4 * 0.15) + (nota5Simulada * 0.40)

    promedioISIL = Math.round(promedioDecimal)

    if(promedioISIL >= 13){
        mensaje = "Con esa Nota 5 estarías APROBADO."
        claseEstado = "mini-aprobado"
    }else{
        mensaje = "Con esa Nota 5 estarías DESAPROBADO."
        claseEstado = "mini-desaprobado"
    }

    document.getElementById("resultadoSimulacionCurso" + numeroCurso).innerHTML = `
        <div class="mini-simulacion ${claseEstado}">
            <strong>${mensaje}</strong>
            <br>
            Nota 5 simulada: ${nota5Simulada}
            <br>
            Promedio sin redondear: ${promedioDecimal.toFixed(2)}
            <br>
            Promedio ISIL: ${promedioISIL}
        </div>
    `
}


// Calcular promedio ponderado de todos los cursos
function calcularPromedio(){
    let cantidad, i
    let nombreCurso, creditos
    let n1, n2, n3, n4, n5
    let promedioDecimal, promedioCurso
    let sumaCreditos, sumaPonderada
    let promedioFinalDecimal, promedioFinal, estado
    let tabla
    let nota5Minima
    let cursosAprobados, cursosDesaprobados, creditosAprobados
    let cursosPendientes
    let datosFaltantes

    cantidad = parseInt(document.getElementById("cantidadCursos").value)

    sumaCreditos = 0
    sumaPonderada = 0
    cursosAprobados = 0
    cursosDesaprobados = 0
    creditosAprobados = 0
    cursosPendientes = 0

    if(cantidad == 1){
        seleccionarModo("curso")

        document.getElementById("resultado").innerHTML = `
            <div class="alerta-personalizada">
                <i class="bi bi-info-circle-fill"></i>
                Para calcular solo 1 curso se activó automáticamente la opción 2.
            </div>
        `
        return
    }

    if(isNaN(cantidad) || cantidad < 2){
        document.getElementById("resultado").innerHTML = `
            <div class="alerta-personalizada">
                <i class="bi bi-exclamation-triangle-fill"></i>
                Para calcular el promedio ponderado debe ingresar mínimo 2 cursos.
            </div>
        `
        return
    }

    if(document.getElementById("zonaCursos").innerHTML == ""){
        document.getElementById("resultado").innerHTML = `
            <div class="alerta-personalizada">
                <i class="bi bi-exclamation-triangle-fill"></i>
                Primero debe generar los cursos.
            </div>
        `
        return
    }

    for(i = 1; i <= cantidad; i++){
        datosFaltantes = []

        creditos = parseInt(document.getElementById("creditos" + i).value)
        n1 = parseFloat(document.getElementById("n1_" + i).value)
        n2 = parseFloat(document.getElementById("n2_" + i).value)
        n3 = parseFloat(document.getElementById("n3_" + i).value)
        n4 = parseFloat(document.getElementById("n4_" + i).value)

        if(isNaN(creditos)){
            datosFaltantes.push("Créditos")
        }

        if(isNaN(n1)){
            datosFaltantes.push("Nota 1")
        }

        if(isNaN(n2)){
            datosFaltantes.push("Nota 2")
        }

        if(isNaN(n3)){
            datosFaltantes.push("Nota 3")
        }

        if(isNaN(n4)){
            datosFaltantes.push("Nota 4")
        }

        if(datosFaltantes.length > 0){
            document.getElementById("resultado").innerHTML = `
                <div class="alerta-personalizada">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    Complete los datos faltantes del curso ${i}: ${datosFaltantes.join(", ")}.
                </div>
            `
            return
        }
    }

    tabla = `
        <h2>
            <i class="bi bi-clipboard-data-fill"></i>
            Resultado por cursos
        </h2>

        <div class="table-responsive">
            <table class="table table-bordered table-hover align-middle text-center">
                <thead>
                    <tr>
                        <th>Curso</th>
                        <th>Créditos</th>
                        <th>Nota 5 mínima</th>
                        <th>Simular Nota 5</th>
                        <th>Promedio sin redondear</th>
                        <th>Promedio ISIL</th>
                        <th>Estado</th>
                    </tr>
                </thead>

                <tbody>
    `

    for(i = 1; i <= cantidad; i++){
        nombreCurso = document.getElementById("curso" + i).value
        creditos = parseInt(document.getElementById("creditos" + i).value)

        n1 = parseFloat(document.getElementById("n1_" + i).value)
        n2 = parseFloat(document.getElementById("n2_" + i).value)
        n3 = parseFloat(document.getElementById("n3_" + i).value)
        n4 = parseFloat(document.getElementById("n4_" + i).value)
        n5 = parseFloat(document.getElementById("n5_" + i).value)

        if(nombreCurso == ""){
            nombreCurso = "Curso " + i
        }

        nota5Minima = calcularNota5Minima(n1, n2, n3, n4)

        sumaCreditos = sumaCreditos + creditos

        if(isNaN(n5)){
            cursosPendientes = cursosPendientes + 1

            tabla = tabla + `
                <tr>
                    <td class="fw-bold">${nombreCurso}</td>
                    <td>${creditos}</td>
                    <td class="fw-bold text-danger">${nota5Minima}</td>

                    <td>
                        <div class="d-flex gap-2 justify-content-center flex-wrap">
                            <select id="nota5SimuladaCurso${i}" class="form-select simulador-input-tabla">
                                ${opcionesNotas()}
                            </select>

                            <button class="btn btn-primary btn-sm" onclick="evaluarNota5SimuladaCurso(${i})">
                                Evaluar
                            </button>
                        </div>

                        <div id="resultadoSimulacionCurso${i}" class="mt-2"></div>
                    </td>

                    <td>Pendiente</td>
                    <td>Pendiente</td>
                    <td>
                        <span class="badge text-bg-warning">Falta Nota 5</span>
                    </td>
                </tr>
            `
        }else{
            promedioDecimal = (n1 * 0.15) + (n2 * 0.15) + (n3 * 0.15) + (n4 * 0.15) + (n5 * 0.40)

            promedioCurso = Math.round(promedioDecimal)

            sumaPonderada = sumaPonderada + (promedioCurso * creditos)

            if(promedioCurso >= 13){
                estado = "<span class='badge text-bg-success'>Aprobado</span>"
                cursosAprobados = cursosAprobados + 1
                creditosAprobados = creditosAprobados + creditos
            }else{
                estado = "<span class='badge text-bg-danger'>Desaprobado</span>"
                cursosDesaprobados = cursosDesaprobados + 1
            }

            tabla = tabla + `
                <tr>
                    <td class="fw-bold">${nombreCurso}</td>
                    <td>${creditos}</td>
                    <td>
                        <span class="badge text-bg-secondary">No aplica</span>
                    </td>
                    <td>
                        <span class="badge text-bg-secondary">Nota 5 registrada</span>
                    </td>
                    <td>${promedioDecimal.toFixed(2)}</td>
                    <td class="fw-bold">${promedioCurso}</td>
                    <td>${estado}</td>
                </tr>
            `
        }
    }

    tabla = tabla + `
                </tbody>
            </table>
        </div>
    `

    if(cursosPendientes > 0){
        tabla = tabla + `
            <div class="promedio-final">
                <i class="bi bi-hourglass-split"></i>
                Promedio ponderado final pendiente
                <br>
                <small>
                    Debe completar la Nota 5 de ${cursosPendientes} curso(s) para calcular el promedio final.
                </small>
            </div>
        `
    }else{
        promedioFinalDecimal = sumaPonderada / sumaCreditos
        promedioFinal = Math.round(promedioFinalDecimal)

        tabla = tabla + `
            <div class="promedio-final">
                <i class="bi bi-award-fill"></i>
                Promedio ponderado final ISIL: ${promedioFinal}
                <br>
                <small>Promedio sin redondear: ${promedioFinalDecimal.toFixed(2)}</small>
            </div>
        `
    }

    tabla = tabla + `
        <div class="resumen-final row g-3 mt-4">

            <div class="col col-sm-12 col-md-6 col-lg-3">
                <div class="resumen-card">
                    <i class="bi bi-check-circle-fill text-success"></i>
                    <div class="resumen-numero">${cursosAprobados}</div>
                    <div class="resumen-label">Cursos aprobados</div>
                </div>
            </div>

            <div class="col col-sm-12 col-md-6 col-lg-3">
                <div class="resumen-card">
                    <i class="bi bi-x-circle-fill text-danger"></i>
                    <div class="resumen-numero">${cursosDesaprobados}</div>
                    <div class="resumen-label">Cursos desaprobados</div>
                </div>
            </div>

            <div class="col col-sm-12 col-md-6 col-lg-3">
                <div class="resumen-card">
                    <i class="bi bi-bookmark-star-fill text-primary"></i>
                    <div class="resumen-numero">${sumaCreditos}</div>
                    <div class="resumen-label">Créditos totales</div>
                </div>
            </div>

            <div class="col col-sm-12 col-md-6 col-lg-3">
                <div class="resumen-card">
                    <i class="bi bi-patch-check-fill text-success"></i>
                    <div class="resumen-numero">${creditosAprobados}</div>
                    <div class="resumen-label">Créditos aprobados</div>
                </div>
            </div>

        </div>
    `

    document.getElementById("resultado").innerHTML = tabla
}


// Limpiar todo
function limpiar(){
    modoActual = ""

    document.getElementById("cantidadCursos").value = ""
    document.getElementById("zonaCursos").innerHTML = ""
    document.getElementById("zonaCursoUnico").innerHTML = ""
    document.getElementById("resultado").innerHTML = ""

    document.getElementById("panelPonderado").classList.add("d-none")
    document.getElementById("panelCurso").classList.add("d-none")
    document.getElementById("accionesPonderado").classList.add("d-none")
    document.getElementById("accionesCurso").classList.add("d-none")
}