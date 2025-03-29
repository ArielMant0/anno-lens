import { extent, quadtree, scaleLinear } from "d3";

const DATA_TYPES = Object.freeze({
    SEQUENTIAL: 1,
    ORDINAL: 2,
    INTEGER: 3,
    QUANTILE: 4,
    BOOLEAN: 5,
})

onmessage = (e) => {
    console.log("Message received from main script");
    postMessage(calc(
        e.data.columns,
        e.data.types,
        e.data.data,
        e.data.stats,
        e.data.width,
        e.data.height,
        e.data.radius,
        e.data.size)
    );
};

function mean(data) {
    const f = data.filter(d => Number.isFinite(d) && !Number.isNaN(d))
    return f.reduce((acc, d) => acc + d, 0) / f.length
}

function deviation(data) {
    const f = data.filter(d => Number.isFinite(d) && !Number.isNaN(d))
    const m = mean(f)
    return f.reduce((acc, d) => acc + Math.sqrt(d - m), 0) / f.length
}

function calcDeviation(data, column, type, stats) {
    const vals = dataToNumbers(data, column, type)
    let vd, gl

    if (type === DATA_TYPES.BOOLEAN) {
        const count = vals.reduce((acc, v) => acc + (v ? 1 : 0), 0)
        vd = count ===  0 ? NaN : 1 - count / vals.length
        gl = count ===  0 ? NaN : count /  stats[column].count // + 0.1 * count / vals.length
    } else {
        vd = deviation(vals)
        const m = mean(vals)
        const v = vals.reduce((acc, d) => acc + Math.sqrt(d - m), 0) / (vals.length-1)
        gl = Math.abs(stats[column].value - v)
    }

    return [vd, gl]
}

function getAttr(d, name) {
    let acc = name;
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

function dataToNumbers(data, column, type) {
    let vals = [];
    switch (type) {
        case DATA_TYPES.BOOLEAN:
            vals = data.map(d => getAttr(d, column) === true ? 1 : 0)
            break
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


function findInCirlce(tree, px, py, r) {
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

function calc(columns, types, sourcedata, stats, width, height, radius, size) {
    const n = Math.floor(width / size)
    const m = Math.floor(height / size)

    const maps = {}

    const x = scaleLinear()
        .domain(extent(sourcedata, d => d.x))
        .range([0, width])
    const y = scaleLinear()
        .domain(extent(sourcedata, d => d.y))
        .range([height, 0])

    // calculate quadtree
    const tree = quadtree()
        .x(d => x(d.x))
        .y(d => y(d.y))
        .addAll(sourcedata)

    // calculate a map for each feature
    // (local vs. global, rare vs. frequent)
    columns.forEach((c, k) => {

        const dl = new Map(), dg = new Map()
        const dc = new Map()
        let minLocal = Number.MAX_VALUE, maxLocal = Number.MIN_VALUE
        let minGlobal = Number.MAX_VALUE, maxGlobal = Number.MIN_VALUE

        for (let i = 0; i < n; ++i) {
            for (let j = 0; j < m; ++j) {
                const data = findInCirlce(tree, i*size, j*size, radius)
                const [l, g] = calcDeviation(data, c, types[k], stats)
                if (!Number.isNaN(l) && Number.isFinite(l)) {
                    data.forEach(d => {
                        const vl = (dl.get(d.id) || 0) + l, vg = (dg.get(d.id) || 0) + g
                        dl.set(d.id, vl)
                        dg.set(d.id, vg)
                        dc.set(d.id, (dc.get(d.id) || 0) + 1)
                        // remember min/max values
                        minLocal = Math.min(vl, minLocal)
                        maxLocal = Math.max(vl, maxLocal)
                        minGlobal = Math.min(vg, minGlobal)
                        maxGlobal = Math.max(vg, maxGlobal)
                    })
                }
            }
        }

        // normalize
        dc.forEach((count, id) => {
            dl.set(id, dl.get(id) / count)
            dg.set(id, dg.get(id) / count)
        })

        maps[c] = {
            local: dl,
            global: dg,
            localMin: minLocal,
            localMax: maxLocal,
            localMean: mean(dl.values()),
            globalMin: minGlobal,
            globalMax: maxGlobal,
            globalMean: mean(dg.values()),
        }
    })

    return maps
}