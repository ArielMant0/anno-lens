import { DATA_TYPES } from "@/stores/app";
import { group } from "d3";

export function dataToNumbers(data, column, type) {
    let vals = [];
    switch (type) {
        case DATA_TYPES.SEQUENTIAL:
            vals = data.map(d => d[column])
            break;
        case DATA_TYPES.ORDINAL:
            const list = Array.from(new Set(data.map(d => d[column])))
            const n = new Map(list.map((v, i) => ([i, v])))
            vals = data.map(d => n.get(d[column]))
            break
    }
    return vals
}

export function getAttr(d, name) {
    const segs = name.split(".")
    if (segs.length === 1) {
        return d[name]
    }
    let val = d;
    segs.forEach(s => val = val[s])
    return val
}