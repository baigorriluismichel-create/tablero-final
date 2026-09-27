app.js

const FILAS = 10;
const COLUMNAS = 10;
const TIEMPO_TURNO = 30;
const OBJETIVO_CASAS = 3;

let casas = [];
let configuracion = {
    modo: "pve",
    dificultad: "medio",
    colorJ1: "azul",
    colorJ2: "rojo",
    nombreJ1: "Jugador 1",
    nombreJ2: "Jugador 2"
};

const MAPA_EMOJIS = {
    verde: "🟢",
    rojo: "🔴",
    azul: "🔵",
    amarillo: "🟡"
};

let fichas = [];
let contadorFichas = 1;

let turnoActual = 1; 
let rondaActual = 1;
let totalMovimientos = 0;
let tiempoInicioPartida = null;

let dadoTirado = false;
let numeroDado = null;
let fichaSeleccionada = null;

let fichasPendientesDeMover = [];

let temporizador = null;
let tiempoRestante = TIEMPO_TURNO;

function reiniciarPartida() {
    casas = [
        { id: 1, fila: 1, columna: 2 },
        { id: 2, fila: 2, columna: 7 },
        { id: 3, fila: 5, columna: 4 },
        { id: 4, fila: 7, columna: 1 },
        { id: 5, fila: 8, columna: 8 }
    ];

    const contenedor = document.getElementById("historial-movimientos");
    if (contenedor) {
        contenedor.innerHTML = '<p class="sin-movimientos">Todavía no hay movimientos.</p>';
    }

    fichas = [
        { id: `f-${contadorFichas++}`, jugador: 1, fila: 0, columna: 0, color: configuracion.colorJ1, activa: true },
        { id: `f-${contadorFichas++}`, jugador: 2, fila: 9, columna: 9, color: configuracion.colorJ2, activa: true }
    ];

    turnoActual = 1;
    rondaActual = 1;
    totalMovimientos = 0;
    tiempoInicioPartida = new Date();

    dadoTirado = false;
    numeroDado = null;
    fichaSeleccionada = null;
    fichasPendientesDeMover = [];

    document.getElementById("casas-j1").textContent = "0";
    document.getElementById("casas-j2").textContent = "0";

    const barraJ1 = document.getElementById("barra-j1");
    const barraJ2 = document.getElementById("barra-j2");

    barraJ1.className = `jugador-color color-bg-${configuracion.colorJ1}`;
    barraJ2.className = `jugador-color color-bg-${configuracion.colorJ2}`;

    let nombreFinalJ1 = configuracion.nombreJ1 || "Jugador 1";
    let nombreFinalJ2 = configuracion.nombreJ2 || "Jugador 2";

    if (configuracion.modo === "eve") {
        nombreFinalJ1 = "Bot 1";
        nombreFinalJ2 = "Bot 2";
    } else if (configuracion.modo === "pve") {
        nombreFinalJ2 = "Bot 2";
    }

    document.getElementById("nombre-j1").textContent = nombreFinalJ1;
    document.getElementById("nombre-j2").textContent = nombreFinalJ2;

    const dadoCentral = document.getElementById("dado-central");
    if (dadoCentral) dadoCentral.textContent = "🎲";

    actualizarInterfaz();
    iniciarTemporizador();
    comprobarTurnoBot();
}

function crearTablero() {
    const tablero = document.getElementById("tablero");
    if (!tablero) return;

    tablero.innerHTML = "";

    for (let fila = 0; fila < FILAS; fila++) {
        for (let columna = 0; columna < COLUMNAS; columna++) {
            const casilla = document.createElement("div");
            casilla.classList.add("casilla");

            casilla.dataset.fila = fila;
            casilla.dataset.columna = columna;

            const casa = casas.find(c => c.fila === fila && c.columna === columna);
            if (casa) {
                casilla.textContent = "🏠";
            }

            const ficha = fichas.find(f => f.fila === fila && f.columna === columna && f.activa);
            if (ficha) {
                casilla.textContent = MAPA_EMOJIS[ficha.color] || "🔴";
                casilla.classList.add("tiene-ficha");

                if (fichaSeleccionada && fichaSeleccionada.id === ficha.id) {
                    casilla.classList.add("casilla-seleccionada");
                }
            }

            casilla.addEventListener("click", () => {
                if (esTurnoHumano() && ficha) seleccionarFicha(ficha);
            });

            tablero.appendChild(casilla);
        }
    }
}

function esTurnoHumano() {
    if (configuracion.modo === "eve") return false;
    if (configuracion.modo === "pve" && turnoActual === 2) return false;
    return true;
}

function seleccionarFicha(ficha) {
    if (ficha.jugador !== turnoActual) {
        alert(`Es el turno del Jugador ${turnoActual}.`);
        return;
    }

    if (dadoTirado && !fichasPendientesDeMover.includes(ficha.id)) {
        alert("Esta ficha ya realizó su movimiento en este turno.");
        return;
    }

    if (fichaSeleccionada && fichaSeleccionada.id === ficha.id) {
        fichaSeleccionada = null;
    } else {
        fichaSeleccionada = ficha;
    }

    crearTablero();
}

function tirarDado() {
    if (dadoTirado) return;

    numeroDado = Math.floor(Math.random() * 3) + 1;
    dadoTirado = true;

    const misFichas = fichas.filter(f => f.jugador === turnoActual && f.activa);
    fichasPendientesDeMover = misFichas.map(f => f.id);

    const elDado = document.getElementById("dado");
    if (elDado) elDado.textContent = numeroDado;

    const dadoCentral = document.getElementById("dado-central");
    if (dadoCentral) {
        dadoCentral.textContent = numeroDado;
        dadoCentral.classList.remove("animar-dado");
        void dadoCentral.offsetWidth;
        dadoCentral.classList.add("animar-dado");
    }

    const nombreTurno = document.getElementById(`nombre-j${turnoActual}`).textContent;
    agregarHistorial(`${nombreTurno} tiró el dado: salió ${numeroDado}.`);

    if (!esTurnoHumano()) {
        setTimeout(ejecutarMovimientoBot, 1000);
    }
}

function calcularNuevaPosicion(filaActual, colActual, direccion, pasos) {
    let nuevaFila = filaActual;
    let nuevaCol = colActual;

    switch (direccion) {
        case "norte": nuevaFila = (filaActual - pasos + FILAS) % FILAS; break;
        case "sur":   nuevaFila = (filaActual + pasos) % FILAS; break;
        case "este":  nuevaCol = (colActual + pasos) % COLUMNAS; break;
        case "oeste": nuevaCol = (colActual - pasos + COLUMNAS) % COLUMNAS; break;
    }

    return { fila: nuevaFila, columna: nuevaCol };
}

function moverFicha(direccion) {
    if (!dadoTirado || !numeroDado) {
        alert("Primero debes tirar el dado.");
        return;
    }

    if (!fichaSeleccionada) {
        alert("Selecciona la ficha que deseas mover.");
        return;
    }

    if (!fichasPendientesDeMover.includes(fichaSeleccionada.id)) {
        alert("Esa ficha ya se movió en este turno. Elige otra.");
        return;
    }

    const nuevaPos = calcularNuevaPosicion(fichaSeleccionada.fila, fichaSeleccionada.columna, direccion, numeroDado);
    fichaSeleccionada.fila = nuevaPos.fila;
    fichaSeleccionada.columna = nuevaPos.columna;
    totalMovimientos++;

    const posDestino = String.fromCharCode(65 + nuevaPos.columna) + (nuevaPos.fila + 1);
    const nombreTurno = document.getElementById(`nombre-j${turnoActual}`).textContent;
    agregarHistorial(`${nombreTurno} movió ficha a ${posDestino}`);

    fichasPendientesDeMover = fichasPendientesDeMover.filter(id => id !== fichaSeleccionada.id);

    const seGano = comprobarConquistaCasa(nuevaPos.fila, nuevaPos.columna);
    fichaSeleccionada = null;

    if (seGano) return;

    if (fichasPendientesDeMover.length > 0) {
        crearTablero();
        if (!esTurnoHumano()) {
            setTimeout(ejecutarMovimientoBot, 1000);
        }
    } else {
        siguienteTurno();
    }
}

function comprobarConquistaCasa(fila, columna) {
    const indiceCasa = casas.findIndex(c => c.fila === fila && c.columna === columna);

    if (indiceCasa !== -1) {
        casas.splice(indiceCasa, 1);

        const colorJugador = turnoActual === 1 ? configuracion.colorJ1 : configuracion.colorJ2;
        const nuevaFicha = {
            id: `f-${contadorFichas++}`,
            jugador: turnoActual,
            fila: fila,
            columna: columna,
            color: colorJugador,
            activa: true
        };

        fichas.push(nuevaFicha);

        const fichasJugador = fichas.filter(f => f.jugador === turnoActual).length;
        const casasConquistadas = fichasJugador - 1; 

        document.getElementById(`casas-j${turnoActual}`).textContent = casasConquistadas;
        const nombreTurno = document.getElementById(`nombre-j${turnoActual}`).textContent;
        agregarHistorial(`¡${nombreTurno} conquistó una casa! Se clonó una nueva ficha.`);

        if (casasConquistadas >= OBJETIVO_CASAS) {
            finalizarPartida();
            return true;
        }
    }
    return false;
}

function comprobarTurnoBot() {
    if (!esTurnoHumano()) {
        setTimeout(tirarDado, 1000);
    }
}

/* LÓGICA DE IA Y DIFICULTAD */
function calcularDistanciaCilindrica(f1, c1, f2, c2) {
    const dFila = Math.abs(f1 - f2);
    const dCol = Math.abs(c1 - c2);
    
    const distFila = Math.min(dFila, FILAS - dFila);
    const distCol = Math.min(dCol, COLUMNAS - dCol);
    
    return distFila + distCol;
}

function ejecutarMovimientoBot() {
    if (fichasPendientesDeMover.length === 0) return;

    const direcciones = ["norte", "sur", "este", "oeste"];
    const misFichasPendientes = fichas.filter(f => fichasPendientesDeMover.includes(f.id));

    let mejorFicha = misFichasPendientes[0];
    let mejorDireccion = direcciones[Math.floor(Math.random() * direcciones.length)];

    if (configuracion.dificultad === "facil") {
        mejorFicha = misFichasPendientes[Math.floor(Math.random() * misFichasPendientes.length)];
        mejorDireccion = direcciones[Math.floor(Math.random() * direcciones.length)];
    } 
    else if (configuracion.dificultad === "medio" || configuracion.dificultad === "dificil") {
        let menorDistanciaGlobal = Infinity;

        for (const ficha of misFichasPendientes) {
            for (const dir of direcciones) {
                const destino = calcularNuevaPosicion(ficha.fila, ficha.columna, dir, numeroDado);

                for (const casa of casas) {
                    const dist = calcularDistanciaCilindrica(destino.fila, destino.columna, casa.fila, casa.columna);

                    if (dist < menorDistanciaGlobal) {
                        menorDistanciaGlobal = dist;
                        mejorFicha = ficha;
                        mejorDireccion = dir;
                    }
                }
            }
        }

        /* Si es nivel medio, hay un 30% de probabilidad de hacer un movimiento impredecible */
        if (configuracion.dificultad === "medio" && Math.random() < 0.3) {
            mejorFicha = misFichasPendientes[Math.floor(Math.random() * misFichasPendientes.length)];
            mejorDireccion = direcciones[Math.floor(Math.random() * direcciones.length)];
        }
    }

    fichaSeleccionada = mejorFicha;
    moverFicha(mejorDireccion);
}

function finalizarPartida() {
    clearInterval(temporizador);

    const tiempoFin = new Date();
    const diferenciaMs = tiempoFin - tiempoInicioPartida;
    const minutos = Math.floor(diferenciaMs / 60000);
    const segundos = Math.floor((diferenciaMs % 60000) / 1000);

    const nombreGanador = turnoActual === 1 ? 
        document.getElementById("nombre-j1").textContent : 
        document.getElementById("nombre-j2").textContent;

    document.getElementById("victoria-subtitulo").textContent = `¡${nombreGanador} ha ganado la partida!`;
    document.getElementById("victoria-tiempo").textContent = `${minutos}m ${segundos}s`;
    document.getElementById("victoria-movimientos").textContent = totalMovimientos;
    document.getElementById("victoria-rondas").textContent = rondaActual;

    setTimeout(() => {
        document.getElementById("modal-victoria").style.display = "flex";
    }, 300);
}

function iniciarTemporizador() {
    clearInterval(temporizador);
    tiempoRestante = TIEMPO_TURNO;
    actualizarRelojUI();

    temporizador = setInterval(() => {
        tiempoRestante--;
        actualizarRelojUI();

        if (tiempoRestante <= 0) {
            clearInterval(temporizador);
            const nombreTurno = document.getElementById(`nombre-j${turnoActual}`).textContent;
            agregarHistorial(`${nombreTurno} agotó su tiempo.`);
            siguienteTurno();
        }
    }, 1000);
}

function actualizarRelojUI() {
    const elTiempo = document.getElementById("temporizador");
    if (elTiempo) elTiempo.textContent = `${tiempoRestante}s`;
}

function siguienteTurno() {
    dadoTirado = false;
    numeroDado = null;
    fichaSeleccionada = null;
    fichasPendientesDeMover = [];

    const elDado = document.getElementById("dado");
    if (elDado) elDado.textContent = "-";

    const dadoCentral = document.getElementById("dado-central");
    if (dadoCentral) dadoCentral.textContent = "🎲";

    if (turnoActual === 1) {
        turnoActual = 2;
    } else {
        turnoActual = 1;
        rondaActual++;
    }

    actualizarInterfaz();
    iniciarTemporizador();
    comprobarTurnoBot();
}

function actualizarInterfaz() {
    const nombreJ1 = document.getElementById("nombre-j1").textContent;
    const nombreJ2 = document.getElementById("nombre-j2").textContent;

    document.getElementById("ronda").textContent = rondaActual;
    document.getElementById("turno").textContent = turnoActual === 1 ? nombreJ1 : nombreJ2;

    const p1 = document.getElementById("panel-jugador-1");
    const p2 = document.getElementById("panel-jugador-2");

    if (turnoActual === 1) {
        p1.classList.add("jugador-activo");
        p2.classList.remove("jugador-activo");
    } else {
        p2.classList.add("jugador-activo");
        p1.classList.remove("jugador-activo");
    }

    crearTablero();
}

function agregarHistorial(mensaje) {
    const contenedor = document.getElementById("historial-movimientos");
    if (!contenedor) return;

    const sinMov = contenedor.querySelector(".sin-movimientos");
    if (sinMov) sinMov.remove();

    const p = document.createElement("p");
    p.classList.add("movimiento");
    p.textContent = mensaje;

    contenedor.prepend(p);
}

document.addEventListener("DOMContentLoaded", () => {
    const modalMenu = document.getElementById("modal-menu");
    const modalVictoria = document.getElementById("modal-victoria");
    const modalManual = document.getElementById("modal-manual");
    const selectModo = document.getElementById("select-modo");
    const contenedorDificultad = document.getElementById("contenedor-dificultad");

    function actualizarVisibilidadDificultad() {
        if (selectModo.value === "pvp") {
            contenedorDificultad.style.display = "none";
        } else {
            contenedorDificultad.style.display = "flex";
        }
    }

    selectModo.addEventListener("change", actualizarVisibilidadDificultad);
    actualizarVisibilidadDificultad();

    document.getElementById("boton-iniciar").addEventListener("click", () => {
        const c1 = document.getElementById("select-color-j1").value;
        const c2 = document.getElementById("select-color-j2").value;

        if (c1 === c2) {
            alert("Los jugadores deben seleccionar colores distintos.");
            return;
        }

        configuracion.modo = selectModo.value;
        configuracion.dificultad = document.getElementById("select-dificultad").value;
        configuracion.colorJ1 = c1;
        configuracion.colorJ2 = c2;
        configuracion.nombreJ1 = document.getElementById("input-nombre-j1").value.trim() || "Jugador 1";
        configuracion.nombreJ2 = document.getElementById("input-nombre-j2").value.trim() || "Jugador 2";

        modalMenu.style.display = "none";
        reiniciarPartida();
    });

    document.getElementById("boton-reiniciar-victoria").addEventListener("click", () => {
        modalVictoria.style.display = "none";
        modalMenu.style.display = "flex";
    });

    document.getElementById("boton-menu").addEventListener("click", () => {
        modalMenu.style.display = "flex";
    });

    document.getElementById("boton-manual")?.addEventListener("click", () => {
        modalManual.style.display = "flex";
    });

    document.getElementById("boton-cerrar-manual")?.addEventListener("click", () => {
        modalManual.style.display = "none";
    });

    document.getElementById("boton-dado")?.addEventListener("click", () => {
        if (esTurnoHumano()) tirarDado();
    });

    document.querySelectorAll("[data-direccion]").forEach(btn => {
        btn.addEventListener("click", () => {
            if (esTurnoHumano()) moverFicha(btn.dataset.direccion);
        });
    });

    const botonTema = document.getElementById("boton-tema");
    if (botonTema) {
        botonTema.addEventListener("click", () => {
            document.body.classList.toggle("modo-claro");
            const esClaro = document.body.classList.contains("modo-claro");
            botonTema.textContent = esClaro ? "☀️" : "🌙";
            localStorage.setItem("tema", esClaro ? "claro" : "oscuro");
        });

        if (localStorage.getItem("tema") === "claro") {
            document.body.classList.add("modo-claro");
            botonTema.textContent = "☀️";
        }
    }
});
