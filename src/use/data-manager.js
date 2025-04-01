import { DATA_TYPES, useApp } from "@/stores/app"
import { bin, deviation, min, max, mean, median, quadtree, scaleLinear, extent, group } from "d3"
import { circleIntersect, dataToNumbers, findInCircle, getAttr } from "./util"
import { LENS_TYPE } from "./Lens"

let _ANNO_ID = 1;

import MyWorker from '@/worker/feature-worker?worker'

function calcStats(data, c, filterType) {
    const ord = filterType === DATA_TYPES.ORDINAL || filterType === DATA_TYPES.NOMINAL || filterType === DATA_TYPES.BOOLEAN
    const vals = dataToNumbers(data, c, filterType)
    let maxVal = max(vals)
    let value = deviation(vals) / maxVal

    let unique = [], count = 0, countRel = 0
    if (ord) {
        if (filterType === DATA_TYPES.BOOLEAN) {
            unique = [false, true]
            count = vals.reduce((acc, v) => acc + (v ? 1 : 0), 0)
            countRel = count / vals.length
            value = count === 0 || count === vals.length ? 0 : 1 - countRel
        } else {
            const gr = group(data, d => getAttr(d, c))
            count = {}
            countRel = {}
            gr.forEach((list, name) => {
                count[name] = list.length
                countRel[name] = list.length / vals.length
                unique.push(name)
            })
            unique.sort((a, b) => a-b)
        }
    } else {
        const tmp = bin().thresholds(5)(vals)
        unique = tmp.map(d => d.x0) //.concat(tmp.at(-1).x1)
        count = tmp.map(d => d.length)
        countRel = tmp.map(d => d.length / vals.length)
    }
    return {
        min: min(vals),
        max: maxVal,
        bins: unique,
        count: count,
        countRel: countRel,
        mean: mean(vals),
        median: median(vals),
        value: value,
    }
}

class DataManager {

    constructor() {
        this.reset()
    }

    reset() {
        this.tree = null
        this.data = []
        this.columns = []
        this.types = []
        this.scales = {}
        this.getters = null

        this.stats = {}
        this.filterStats = {}
        this.filterIds = new Set()

        this.lensData = []
        this.lensResults = []

        this.width = 0
        this.height = 0
        this.xAttr = ""
        this.yAttr = ""
        this.featureMaps = null
        this.lensMaps = null

        this.annotations = []
        this.annoTree = null
    }

    setDataset(dsobj) {
        this.getters = dsobj.getters
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

    getData(filter=true) {
        if (filter && this.filterIds.size > 0) {
            return this.data.filter(d => this.filterIds.has(d))
        }
        return this.data
    }

    computeFeatureMaps(radius, size=10, callback=null) {
        if (this.data.length === 0) return

        const myWorker = new MyWorker();
        // set map upon completion
        myWorker.onmessage = e => {
            console.log("received message from worker")
            this.featureMaps = e.data.maps
            this.lensMaps = e.data.lenses
            if (callback) {
                callback(this.featureMaps)
            }
        }
        // compute feature maps in web worker
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
    }

    computeFilterStats(ids) {
        this.filterIds = new Set(ids)
        if (ids.length === 0) {
            this.filterStats = this.stats
        } else {
            const data = this.data.filter(d => this.filterIds.has(d.id))
            this.columns.forEach((c, i) => this.filterStats[c] = calcStats(data, c, this.types[i]))
        }
    }

    getBestFeatures(lensType, mode) {
        if (!this.featureMaps) return []
        const cols = this.columns.slice()
        cols.sort((a, b) => this.featureMaps[a][mode+'Mean'] - this.featureMaps[b][mode+'Mean'])
        if (lensType === LENS_TYPE.RARE) {
            cols.reverse()
        }
        return cols
    }

    getMatchingLenses(x, y, r, lensIndex, mode, columnIndex) {
        if (!this.lensMaps || !this.lensResults[lensIndex]) return []
        // get lens result
        const col = this.lensResults[lensIndex][mode][columnIndex]
        const n = col.name, v = col.value;
        // return if there are no other lenses (doubt)
        if (!this.lensMaps[n] || this.lensMaps[n].length === 0) return []
        let lenses = this.lensMaps[n].filter(d => !circleIntersect(x, y, r, d[0], d[1], r))
        const vidx = mode === "local" ? 3 : 4
        const size = this.lensData[lensIndex].length
        lenses = lenses.filter(d => Math.abs(d[vidx]-v) < DM.filterStats[n].value)
        if (lenses.length === 0) return []

        lenses
            .sort((a, b) => {
                const vdiff = Math.abs(a[vidx]-v) - Math.abs(b[vidx]-v)
                return vdiff !== 0 ? vdiff : Math.abs(a[2]-size) - Math.abs(b[2]-size)
            })

        return [lenses[0]] //lenses.slice(0, 5)
    }

    findDataInCircle(x, y, radius) {
        return findInCircle(this.tree, x, y, radius)
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

    annotate(x, y, radius, columnIndex, mode, lensType, lensIndex=0) {
        if (this.annoTree === null) {
            this.annoTree = quadtree()
                .x(d => d.x)
                .y(d => d.y)
                .extent([[0, 0], [this.width, this.height]])
        }

        const refVal = this.lensResults[lensIndex][mode][columnIndex].value
        const cols = this.lensResults[lensIndex][mode].filter(d => d.value === refVal)

        this.annoTree.add({
            id: _ANNO_ID++,
            x: x,
            y: y,
            radius: radius,
            mode: mode,
            lensType: lensType,
            columns: cols,
            ids: this.lensData[lensIndex].slice()
        })
    }

    getAnnotations() {
        return this.annoTree ? this.annoTree.data() : []
    }
}

const DM = new DataManager()

export { DM as default }