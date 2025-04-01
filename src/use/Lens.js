import DM from "./data-manager";
import { calcDeviation } from "./util";

let _ID = 1;

export const LENS_TYPE = Object.freeze({
    FREQUENT: 1,
    RARE: 2,
})
export const LENS_TYPES = Object.values(LENS_TYPE)

export class Lens {

    constructor(type=LENS_TYPE.RARE) {
        this.id = _ID++
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
            const none = this.type === LENS_TYPE.FREQUENT ? 1 : 0
            columns.forEach((c, i) => {
                const [l, g] = calcDeviation(data, c, types[i], DM.filterStats, none)
                if (!Number.isNaN(l) && Number.isFinite(l)) {
                    local.push(Object.assign({
                        name: c,
                        type: types[i],
                        value : l
                    }))
                }
                if (!Number.isNaN(g) && Number.isFinite(g)) {
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
            local.sort((a, b) => {
                const diff = a.value - b.value
                if (diff !== 0) return diff
                // if the value is the same, sort by global rarity
                const ga = global.find(d => d.name === a.name)
                const gb = global.find(d => d.name === b.name)
                return gb.value - ga.value
            })
            global.sort((a, b) => {
                const diff = a.value - b.value
                if (diff !== 0) return diff
                // if the value is the same, sort by local rarity
                const la = local.find(d => d.name === a.name)
                const lb = local.find(d => d.name === b.name)
                return lb.value - la.value
            })
        } else {
            local.sort((a, b) => {
                const diff = b.value - a.value
                if (diff !== 0) return diff
                // if the value is the same, sort by global frequency
                const ga = global.find(d => d.name === a.name)
                const gb = global.find(d => d.name === b.name)
                return ga.value - gb.value
            })
            global.sort((a, b) => {
                const diff = b.value - a.value
                if (diff !== 0) return diff
                // if the value is the same, sort by local frequency
                const la = local.find(d => d.name === a.name)
                const lb = local.find(d => d.name === b.name)
                return la.value - lb.value
            })
        }

        this.numResults.local = local.length
        this.numResults.global = global.length

        return {
            local: local,
            global: global,
        }
    }
}