import DM from "./data-manager";
import { calcDeviation } from "./util";

let _ID = 1;

export const LENS_TYPE = Object.freeze({
    FREQUENT: 1,
    RARE: 2,
})
export const LENS_TYPES = Object.values(LENS_TYPE)

export class Lens {

    constructor(type=LENS_TYPE.RARE, active=true) {
        this.id = _ID++
        this.type = type
        this.ids = new Set()
        this.results = { local: [], global: [] }
        this.numResults = { local: 0, global: 0 }
        this.x = null
        this.y = null
        this.radius = null
        this.color = active ? "red" : "black"
        this.active = active;
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
        this.x = null
        this.y = null
        this.radius = null
        this.results.local = []
        this.results.global = []
        this.numResults.local = 0
        this.numResults.global = 0
    }

    isActive() {
        return this.active
    }

    getResult(mode="global", index=null) {
        if (index !== null) {
            if (!this.results[mode]) return null
            return this.results[mode][index]
        } else {
            return this.results[mode]
        }
    }

    _getResultAttr(mode, index, attr) {
        const r = this.getResult(mode, index)
        if (!r) return null
        if (Array.isArray(r)) {
            return r.map(d => d[attr])
        }
        return r[attr]
    }

    getResultColumn(mode, index) {
        return this._getResultAttr(mode, index, "name")
    }

    getResultValue(mode, index) {
        return this._getResultAttr(mode, index, "value")
    }

    getResultType(mode, index) {
        return this._getResultAttr(mode, index, "type")
    }

    getResultIds() {
        return Array.from(this.ids.values())
    }

    getResultData() {
        const data = DM.getData()
        return data.filter(d => this.ids.has(d.id))
    }

    getResultSize() {
        return this.ids.size
    }

    apply(x, y, r, data, columns, types) {
        let local = [], global = []

        this.x = x
        this.y = y
        this.radius = r;

        if (data.length > 0) {
            this.ids = new Set(data.map(d => d.id))
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
        } else {
            this.ids.clear()
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

        this.results.local = local
        this.results.global = global
    }
}