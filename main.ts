/**
 * A4 - Clavier Grove 12 touches (ATtiny1616) - UART 9600
 * Le module envoie 1 octet par touche :
 * 0xE1..0xE9 => 1..9
 * 0xEA       => *  (key=10)
 * 0xEB       => 0  (key=0)
 * 0xEC       => #  (key=11)
 */

//% color=#1B6CA8 icon="\uf11c" block="A4 Clavier 12 touches"
namespace A4_Clavier_12_Touches {
    /**
     * Dernière touche reçue (écrasée à chaque appui).
     * -1 = aucune touche encore reçue
     * 0..9 = chiffres
     * 10 = '*'
     * 11 = '#'
     */
    export let key: number = -1

    let _started = false
    let _configured = false

    function decodeAndStore(code: number): void {
        switch (code) {
            case 0xE1: key = 1; break
            case 0xE2: key = 2; break
            case 0xE3: key = 3; break
            case 0xE4: key = 4; break
            case 0xE5: key = 5; break
            case 0xE6: key = 6; break
            case 0xE7: key = 7; break
            case 0xE8: key = 8; break
            case 0xE9: key = 9; break
            case 0xEA: key = 10; break // '*'
            case 0xEB: key = 0; break  // '0'
            case 0xEC: key = 11; break // '#'
            default:
                // ignore
                break
        }
    }

    function startReaderOnce(): void {
        if (_started) return
        _started = true

        // Lecture UART en arrière-plan (bloquante uniquement dans cette fibre)
        control.inBackground(function () {
            while (true) {
                // readBuffer(1) attend 1 octet
                const buf = serial.readBuffer(1)
                const code = buf.getUint8(0)
                decodeAndStore(code)
            }
        })
    }

    /**
     * Configure le clavier (UART 9600).
     * IMPORTANT câblage :
     *  - TX du module -> RX micro:bit
     *  - RX du module -> TX micro:bit
     *
     * @param rx broche RX de la micro:bit (reçoit depuis le module)
     * @param tx broche TX de la micro:bit (envoie vers le module)
     */
    //% block="CONFIGURER clavier 12 touches RX %rx TX %tx"
    //% rx.defl=SerialPin.P0
    //% tx.defl=SerialPin.P1
    //% group="Clavier"
    //% weight=100
    export function configurer(rx: SerialPin, tx: SerialPin): void {
        serial.redirect(tx, rx, BaudRate.BaudRate9600)
        serial.setRxBufferSize(64)
        _configured = true
        startReaderOnce()
    }

    /**
     * Renvoie la dernière touche reçue (stockée dans la variable 'key').
     * -1 si aucune touche reçue ou si le clavier n'a pas été configuré.
     */
    //% block="LIRE CLAVIER (dernière touche)"
    //% group="Clavier"
    //% weight=90
    export function lireClavier(): number {
        // On ne démarre pas automatiquement le lecteur sans configurer(),
        // pour éviter de perturber d'autres usages du port série.
        if (!_configured) return -1
        return key
    }

    /**
     * Réinitialise la dernière touche (key=-1).
     */
    //% block="EFFACER dernière touche"
    //% group="Clavier"
    //% weight=80
    export function effacerDerniereTouche(): void {
        key = -1
    }
}
