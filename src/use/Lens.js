import { deviation, maxIndex, mean, minIndex } from "d3";
import { calcDeviation, dataToNumbers } from "./util";
import DM from "./data-manager";

let _ID = 1;

export const LENS_TYPE = Object.freeze({
    FREQUENT: 1,
    RARE: 2,
})
export const LENS_TYPES = Object.values(LENS_TYPE)

export class Lens {

    constructor(radius=50, type=LENS_TYPE.RARE) {
        this.id = _ID++
        this.radius = radius
        this.type = type;
        this.numResults = { local: 0, global: 0 }
    }

    static getLensName(type) {
        switch(type) {
            case LENS_TYPE.FREQUENT: return "Frequent"
            default:
            case LENS_TYPE.RARE: return "Rare"
        }
    }

    static getLensColor(type) {
        switch(type) {
            case LENS_TYPE.FREQUENT: return "blue"
            default:
            case LENS_TYPE.RARE: return "red"
        }
    }

    reset() {
        this.numResults.local = 0
        this.numResults.global = 0
    }

    apply(data, columns, types) {
        let local = [], global = []

        if (data.length > 0) {
            columns.forEach((c, i) => {
                const [l, g] = calcDeviation(data, c, types[i])
                if (!Number.isNaN(l)) {
                    local.push(Object.assign({
                        name: c,
                        type: types[i],
                        value : l
                    }))
                    global.push(Object.assign({
                        name: c,
                        type: types[i],
                        value : g
                    }))
                }
            })
            local = local.filter(d => d.value !== undefined)
            global = global.filter(d => d.value !== undefined)
        }

        if (this.type === LENS_TYPE.FREQUENT) {
            local.sort((a, b) => a.value - b.value)
            global.sort((a, b) => a.value - b.value)
        } else {
            local.sort((a, b) => b.value - a.value)
            global.sort((a, b) => b.value - a.value)
        }

        this.numResults.local = local.length
        this.numResults.global = global.length

        return {
            local: local,
            global: global,
        }
    }
}