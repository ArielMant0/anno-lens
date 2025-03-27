import { deviation, maxIndex, mean, minIndex } from "d3";
import { dataToNumbers } from "./util";
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
        this.numResults = 0
    }

    static getLensName(type) {
        switch(type) {
            case LENS_TYPE.FREQUENT: return "Frequent"
            default:
            case LENS_TYPE.RARE: return "Rare"
        }
    }

    apply(data, columns, types, reference=[]) {
        const values = []
        columns.forEach((c, i) => {
            const vals = dataToNumbers(data, c, types[i])
            const vd = deviation(vals)
            const v = Math.sqrt(mean(vals) / (data.length-1))
            const diffs = [Math.abs(DM.stats[c].deviation-v)].concat(reference.map(d => {
                const it = d.find(dd => dd.name === c)
                return it ? Math.abs(it.value-v) : null
            })).filter(d => d !== null)
            values.push({
                name: c,
                value: vd,
                diff: diffs
            })
        })

        let mi;
        if (this.type === LENS_TYPE.FREQUENT) {
            values.sort((a, b) => a.diff[0] - b.diff[0])
            mi = [minIndex(values, d => d.value), 0].concat(reference.map((_, i) => minIndex(values, d => d.diff[i+1])))
        } else {
            values.sort((a, b) => b.diff[0] - a.diff[0])
            mi = [maxIndex(values, d => d.value), 0].concat(reference.map((_, i) => maxIndex(values, d => d.diff[i+1])))
        }

        const miSet = new Set(mi.filter(i => i >= 0))
        this.numResults = miSet.size
        return Array.from(miSet.values()).map(i => values[i]).concat(values.filter((_, i) => !miSet.has(i)))
    }
}