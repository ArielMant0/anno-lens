import { DATA_TYPES, useApp } from "@/stores/app";
import { deviation, extent, group, interpolateTurbo, mean, scaleOrdinal, scaleQuantile, scaleSequential, schemeBlues, schemeCategory10, schemeOrRd } from "d3";
import DM from "./data-manager";

export function getDataType(d, name) {
    const app = useApp()
    if (app.datasetObj.types && app.datasetObj.types[name]) {
        return app.datasetObj.types[name]
    }
    const v = getAttr(d, name)
    switch (typeof v) {
        case "boolean":
            return DATA_TYPES.BOOLEAN
        // case 'object':
        //     return DATA_TYPES.SET
        case 'string':
            return DATA_TYPES.ORDINAL
        default:
        case 'number':
            return DATA_TYPES.SEQUENTIAL
    }
}

export function dataToNumbers(data, column, type) {
    let vals = [];
    switch (type) {
        case DATA_TYPES.BOOLEAN:
            vals = data.map(d => getAttr(d, column) === true ? 1 : 0)
            break
        // case DATA_TYPES.SET:
        //     vals = data.map(d => getAttr(d, column))
        //     const it = vals[0][0]
        //     if (typeof it === "object") {
        //         if (Array.isArray(it)) {
        //             vals = vals.map(d => d.map(dd => dd[0]))
        //         } else {
        //             vals = vals.map(d => d.map(dd => dd.id))
        //         }
        //     }
        //     break
        case DATA_TYPES.ORDINAL:
            const list = Array.from(new Set(data.map(d => getAttr(d, column))).values())
            const n = new Map(list.map((v, i) => ([v, i])))
            vals = data.map(d => n.get(getAttr(d, column)))
            break
        case DATA_TYPES.QUANTILE:
        case DATA_TYPES.INTEGER:
        case DATA_TYPES.SEQUENTIAL:
            vals = data.map(d => getAttr(d, column))
            break
    }
    return vals
}

export function makeColorScale(data, column, type) {
    switch(type) {
        case DATA_TYPES.BOOLEAN: {
            return scaleOrdinal(["lightgrey", "black"]).domain([false, true]).unknown("red")
        }
        case DATA_TYPES.INTEGER: {
            const tmp = extent(data, d => getAttr(d, column))
            tmp.sort()
            return scaleOrdinal(schemeBlues).domain(tmp).unknown("black")
        }
        case DATA_TYPES.QUANTILE:
            return scaleQuantile(data.map(d => getAttr(d, column)), schemeOrRd[6]).unknown("black")
        // case DATA_TYPES.SET: {
        //     const tmp = data.map(d => getAttr(d, column).length)
        //     return scaleQuantile(tmp, schemeOrRd[6]).unknown("black")
        // }
        case DATA_TYPES.SEQUENTIAL:
            return scaleSequential(interpolateTurbo)
                .unknown("grey")
                .domain(extent(data, d => getAttr(d, column)))
        default:
        case DATA_TYPES.ORDINAL: {
            const tmp = group(data, d => getAttr(d, column))
            const dom = Array.from(tmp.keys())
            dom.sort()
            return scaleOrdinal(schemeCategory10).domain(dom).unknown("black")
        }
    }
}

export function getAttr(d, name) {
    let acc = name;

    const app = useApp()
    if (app.datasetObj.getters && app.datasetObj.getters[name]) {
        acc = app.datasetObj.getters[name]
    }

    switch (typeof acc) {
        case "number":
        case "string": {
            const segs = acc.split(".")
            if (segs.length === 1) {
                return d[acc]
            }
            let val = d;
            segs.forEach(s => val = val[s])
            return val
        }
        case "object": return d[acc].length
        case "function": return acc(d)
        default: return null
    }
}

export function calcDeviation(data, column, type) {
    const vals = dataToNumbers(data, column, type)
    let vd, gl

    if (type === DATA_TYPES.BOOLEAN) {
        const count = vals.reduce((acc, v) => acc + (v ? 1 : 0), 0)
        vd = count ===  0 ? NaN : 1 - count / vals.length
        gl = count ===  0 ? NaN : count /  DM.filterStats[column].count + 0.1 * count / vals.length
    } else {
        vd = deviation(vals)
        const v = Math.sqrt(mean(vals) / (data.length-1))
        gl = Math.abs(DM.filterStats[column].value - v)
    }

    return [vd, gl]
}