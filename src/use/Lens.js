import { DATA_TYPES } from "@/stores/app";
import { deviation, group, variance } from "d3";

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
    }

    static getLensName(type) {
        switch(type) {
            case LENS_TYPE.FREQUENT: return "Frequent"
            default:
            case LENS_TYPE.RARE: return "Rare"
        }
    }

    apply(data, columns, types) {
        const values = []
        columns.forEach((c, i) => {
            let vals;
            switch (types[i]) {
                case DATA_TYPES.SEQUENTIAL:
                    vals = data.map(d => d[c])
                    break;
                case DATA_TYPES.ORDINAL:
                    const g = group(data, d => d[c])
                    const n = Array.from(g.keys())
                    vals = data.map(d => n.indexOf(d[d[c]]))
                    break
            }

            const v = deviation(vals)
            values.push({ name: c, value: v })
        })

        if (this.type === LENS_TYPE.FREQUENT) {
            values.sort((a, b) => a.value - b.value)
        } else {
            values.sort((a, b) => b.value - a.value)
        }

        return values
    }
}