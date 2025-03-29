import { DATA_TYPES, useApp } from "@/stores/app"
import { bin, deviation, min, max, mean, median, quadtree, scaleLinear, extent } from "d3"
import { calcDeviation, dataToNumbers, findInCirlce, getAttr } from "./util"
import { LENS_TYPE } from "./Lens"

import MyWorker from '@/worker/feature-worker?worker'

function calcStats(data, c, filterType) {
    const ord = filterType === DATA_TYPES.ORDINAL || filterType === DATA_TYPES.BOOLEAN
    const vals = dataToNumbers(data, c, filterType)
    let value = deviation(vals)

    let unique = [], count = 0;
    if (ord) {
        if (filterType === DATA_TYPES.BOOLEAN) {
            unique = [false, true]
            count = vals.reduce((acc, v) => acc + (v ? 1 : 0), 0)
            value = count === 0 || count === vals.length ? 0 : 1 - count / vals.length
        } else {
            unique = Array.from(new Set(data.map(d => getAttr(d, c))))
        }
        unique.sort()
    } else {
        const tmp = bin().thresholds(5)(vals)
        unique = tmp.map(d => d.x0).concat(tmp.at(-1).x1)
    }
    return {
        min: min(vals),
        max: max(vals),
        bins: unique,
        count: count,
        mean: mean(vals),
        median: median(vals),
        value: value,
    }
}

class DataManager {

    constructor() {
        this.data = []
        this.columns = []
        this.types = []
        this.stats = {}
        this.filterStats = {}
        this.lensData = []
        this.lensResults = []
        this.scales = {}
        this.tree = null
        this.width = 0
        this.height = 0
        this.xAttr = ""
        this.yAttr = ""
        this.featureMaps = null
    }

    setData(data=[], columns=[], types=[], xAttr="x", yAttr="y", width=500, height=500) {
        this.data = data
        this.columns = columns
        this.types = types
        this.xAttr = xAttr
        this.yAttr = yAttr
        this.width = width
        this.height = height

        // calculate stats
        this.stats = {}
        columns.forEach((c, i) => this.stats[c] = calcStats(data, c, types[i]))
        this.filterStats = this.stats;

        // scales for quadtree
        this.x = scaleLinear()
            .domain(extent(data, d => getAttr(d, this.xAttr)))
            .range([0, width])
        this.y = scaleLinear()
            .domain(extent(data, d => getAttr(d, this.yAttr)))
            .range([height, 0])

        // calculate quadtree
        this.tree = quadtree()
            .x(d => this.x(getAttr(d, this.xAttr)))
            .y(d => this.y(getAttr(d, this.yAttr)))
            .addAll(data)

        // mark as updated
        const app = useApp()
        app.updateData()
    }

    computeFeatureMaps(radius, size=10, callback=null) {
        if (this.data.length === 0) return

        const myWorker = new MyWorker();
        // set map upon completion
        myWorker.onmessage = e => {
            console.log("received message from worker")
            this.featureMaps = e.data
            if (callback) {
                callback(this.featureMaps)
            }
        }


        myWorker.postMessage({
            columns: this.columns,
            types: this.types,
            data: this.data,
            stats: this.filterStats,
            width: this.width,
            height: this.height,
            radius: radius,
            size: size,
        })

        // const n = Math.floor(this.width / size)
        // const m = Math.floor(this.height / size)

        // const maps = {}

        // // calculate a map for each feature
        // // (local vs. global, rare vs. frequent)
        // this.columns.forEach((c, k) => {

        //     const dl = new Map(), dg = new Map()
        //     const dc = new Map()
        //     let minLocal = Number.MAX_VALUE, maxLocal = Number.MIN_VALUE
        //     let minGlobal = Number.MAX_VALUE, maxGlobal = Number.MIN_VALUE

        //     for (let i = 0; i < n; ++i) {
        //         for (let j = 0; j < m; ++j) {
        //             const data = findInCirlce(this.tree, i*size, j*size, radius)
        //             const [l, g] = calcDeviation(data, c, this.types[k])
        //             if (!Number.isNaN(l) && Number.isFinite(l)) {
        //                 data.forEach(d => {
        //                     const vl = (dl.get(d.id) || 0) + l, vg = (dg.get(d.id) || 0) + g
        //                     dl.set(d.id, vl)
        //                     dg.set(d.id, vg)
        //                     dc.set(d.id, (dc.get(d.id) || 0) + 1)
        //                     // remember min/max values
        //                     minLocal = Math.min(vl, minLocal)
        //                     maxLocal = Math.max(vl, maxLocal)
        //                     minGlobal = Math.min(vg, minGlobal)
        //                     maxGlobal = Math.max(vg, maxGlobal)
        //                 })
        //             }
        //         }
        //     }

        //     // normalize
        //     dc.forEach((count, id) => {
        //         dl.set(id, dl.get(id) / count)
        //         dg.set(id, dg.get(id) / count)
        //     })

        //     maps[c] = {
        //         local: dl,
        //         global: dg,
        //         localMin: minLocal,
        //         localMax: maxLocal,
        //         localMean: mean(dl.values()),
        //         globalMin: minGlobal,
        //         globalMax: maxGlobal,
        //         globalMean: mean(dg.values()),
        //     }
        // })

    }

    computeFilterStats(ids) {
        if (ids.length === 0) {
            this.filterStats = this.stats
        } else {
            const set = new Set(ids)
            const data = this.data.filter(d => set.has(d.id))
            this.columns.forEach((c, i) => this.filterStats[c] = calcStats(data, c, this.types[i]))
        }
    }

    getBestFeatures(lensType, mode) {
        const cols = this.columns.slice()
        cols.sort((a, b) => this.featureMaps[a][mode+'Mean'] - this.featureMaps[b][mode+'Mean'])
        if (lensType === LENS_TYPE.RARE) {
            cols.reverse()
        }
        return cols
    }

    setLensData(data=[]) {
        this.lensData = data
        const app = useApp()
        app.updateLensData()
    }

    setLensResults(results=[]) {
        this.lensResults = results
    }

    setScales(scales={}) {
        this.scales = scales
    }

    getDataBy(filter) {
        return this.data.filter(filter)
    }

    getLensData(index) {
        return this.lensData[index]
    }
}

const DM = new DataManager()

export { DM as default }