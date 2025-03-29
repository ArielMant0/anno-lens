import { DATA_TYPES, useApp } from "@/stores/app"
import { bin, deviation, min, max, mean, median } from "d3"
import { dataToNumbers, getAttr } from "./util"

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
    }

    setData(data=[], columns=[], types=[]) {
        this.data = data
        this.columns = columns
        this.types = types
        this.stats = {}
        columns.forEach((c, i) => this.stats[c] = calcStats(data, c, types[i]))
        this.filterStats = this.stats;
        const app = useApp()
        app.updateData()
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