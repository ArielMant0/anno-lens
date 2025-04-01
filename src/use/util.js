import { DATA_TYPES, useApp } from "@/stores/app";
import { bin, deviation, extent, group, interpolatePlasma, mean, scaleOrdinal, scaleQuantile, scaleSequential, schemeBlues, schemeCategory10, schemeOrRd } from "d3";
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
        case 'string':
            return DATA_TYPES.NOMINAL
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
        case DATA_TYPES.NOMINAL:
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
    return vals.filter(d => Number.isFinite(d) && !Number.isNaN(d))
}

export function makeColorScale(data, column, type, primary="blue") {
    switch(type) {
        case DATA_TYPES.BOOLEAN: {
            return scaleOrdinal(["lightgrey", primary]).domain([false, true]).unknown("red")
        }
        case DATA_TYPES.INTEGER: {
            const tmp = extent(data, d => getAttr(d, column))
            tmp.sort((a, b) => a-b)
            return scaleOrdinal(schemeBlues).domain(tmp).unknown("black")
        }
        case DATA_TYPES.QUANTILE:
            return scaleQuantile(data.map(d => getAttr(d, column)), schemeOrRd[6]).unknown("black")
        case DATA_TYPES.SEQUENTIAL:
            return scaleSequential(interpolatePlasma)
                .unknown("black")
                .domain(extent(data, d => getAttr(d, column)))
        case DATA_TYPES.ORDINAL: {
            const tmp = group(data, d => getAttr(d, column))
            const dom = Array.from(tmp.keys())
            dom.sort((a, b) => a-b)
            return scaleOrdinal(schemeBlues[9]).domain(dom).unknown("black")
        }
        default:
        case DATA_TYPES.NOMINAL: {
            const tmp = group(data, d => getAttr(d, column))
            const dom = Array.from(tmp.keys())
            dom.sort((a, b) => a-b)
            return scaleOrdinal(schemeCategory10).domain(dom).unknown("black")
        }
    }
}

export function getAttr(d, name) {
    let acc = name;

    if (DM.getters && DM.getters[name]) {
        acc = DM.getters[name]
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

export function calcDeviation(data, column, type, stats, none=NaN) {
    let vd, gl

    if (type === DATA_TYPES.BOOLEAN) {
        const vals = dataToNumbers(data, column, type)
        const count = vals.reduce((acc, v) => acc + (v ? 1 : 0), 0)
        vd = count > 0 ? 1 - count / vals.length : none
        gl = count > 0 ? Math.abs((count / vals.length) - stats[column].countRel) : none
        // count / stats[column].count // + 0.1 * count / vals.length
    } else if (type === DATA_TYPES.ORDINAL || type === DATA_TYPES.NOMINAL) {
        const count = group(data, d => getAttr(d, column))
        vd = 0, gl = 0
        count.forEach((list, name) => {
            vd += (1 - list.length) / data.length
            gl += Math.abs((list.length / data.length) - stats[column].countRel[name])
        })
        vd = vd / count.size
    } else {
        const vals = dataToNumbers(data, column, type)
        vd = deviation(vals) / stats[column].max

        const tmp = bin()
            .thresholds(stats[column].bins.length)
            .domain([stats[column].min, stats[column].max])
            (vals)
        gl = tmp.reduce((acc, d, i) => {
            return acc + vals.length > 0 ?
                Math.abs((d.length / vals.length) - stats[column].countRel[i]) :
                0
        }, 0)
    }

    return [vd, gl]
}


export function findInCircle(tree, px, py, r) {
    const result = [], radius2 = r * r
    tree.visit(function(node, x1, y1, x2, y2) {
        if (node.length) {
            return x1 >= px + r || y1 >= py + r || x2 < px - r || y2 < py - r;
        }

        const dx = +tree._x.call(null, node.data) - px,
            dy = +tree._y.call(null, node.data) - py;

        if (dx * dx + dy * dy < radius2) {
            do { result.push(node.data); } while (node = node.next);
        }
    });

    return result;
}

export function circleIntersect(x0, y0, r0, x1, y1, r1) {
    return Math.hypot(x0 - x1, y0 - y1) <= r0 + r1;
}

export function deg2rad(degree) {
    return degree * Math.PI / 180
}

export function rad2deg(radian) {
    return radian * 180 / Math.PI
}

