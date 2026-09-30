
(function (global) {
    "use strict";

    function calcularDistanciaCilindrica(f1, c1, f2, c2, FILAS, COLUMNAS) {
        const dFila = Math.abs(f1 - f2);
        const dCol = Math.abs(c1 - c2);
        const distFila = Math.min(dFila, FILAS - dFila);
        const distCol = Math.min(dCol, COLUMNAS - dCol);
        return distFila + distCol;
    }

    function calcularNuevaPosicion(filaActual, colActual, direccion, pasos, FILAS, COLUMNAS) {
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

    /**
     * Función principal que decide el movimiento del bot.
     * @param {Object} estado - Estado actual del juego (ver documentación arriba)
     * @returns {{ fichaId: string, direccion: string }}
     */
    function decidirMovimientoBot(estado) {
        const {
            numeroDado,
            fichasPendientes,
            casas,
            filas: FILAS,
            columnas: COLUMNAS,
            dificultad
        } = estado;

        if (!fichasPendientes || fichasPendientes.length === 0) {
            return null;
        }

        const direcciones = ["norte", "sur", "este", "oeste"];
        let mejorFicha = fichasPendientes[0];
        let mejorDireccion = direcciones[Math.floor(Math.random() * direcciones.length)];

        if (dificultad === "facil") {
            mejorFicha = fichasPendientes[Math.floor(Math.random() * fichasPendientes.length)];
            mejorDireccion = direcciones[Math.floor(Math.random() * direcciones.length)];
        } else if (dificultad === "medio" || dificultad === "dificil") {
            let menorDistanciaGlobal = Infinity;

            for (const ficha of fichasPendientes) {
                for (const dir of direcciones) {
                    const destino = calcularNuevaPosicion(
                        ficha.fila, ficha.columna, dir, numeroDado, FILAS, COLUMNAS
                    );

                    for (const casa of casas) {
                        const dist = calcularDistanciaCilindrica(
                            destino.fila, destino.columna,
                            casa.fila, casa.columna,
                            FILAS, COLUMNAS
                        );

                        if (dist < menorDistanciaGlobal) {
                            menorDistanciaGlobal = dist;
                            mejorFicha = ficha;
                            mejorDireccion = dir;
                        }
                    }
                }
            }

            /* Nivel medio: 30% de probabilidad de movimiento impredecible */
            if (dificultad === "medio" && Math.random() < 0.3) {
                mejorFicha = fichasPendientes[Math.floor(Math.random() * fichasPendientes.length)];
                mejorDireccion = direcciones[Math.floor(Math.random() * direcciones.length)];
            }
        }

        return {
            fichaId: mejorFicha.id,
            direccion: mejorDireccion
        };
    }

    // Exponer la función globalmente para que el juego pueda usarla
    global.decidirMovimientoBot = decidirMovimientoBot;

    // También exportar para entornos module (opcional)
    if (typeof module !== "undefined" && module.exports) {
        module.exports = { decidirMovimientoBot };
    }

})(typeof window !== "undefined" ? window : globalThis);
