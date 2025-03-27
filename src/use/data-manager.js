import { DATA_TYPES, useApp } from "@/stores/app"
import { bin, deviation, min, max, mean, median, variance } from "d3"
import { dataToNumbers } from "./util"

class DataManager {

    constructor() {
        this.data = []
        this.columns = []
        this.types = []
        this.stats = {}
        this.lensData = []
        this.lensTypes = []
        this.lensColumns = []
        this.scales = {}
    }

    setData(data=[], columns=[], types=[]) {
        this.data = data
        this.columns = columns
        this.types = types
        this.stats = {}
        columns.forEach((c, i) => {
            let unique = []
            const vals = dataToNumbers(data, c, types[i])
            const ord = types[i] === DATA_TYPES.ORDINAL
            if (ord) {
                unique = data.map(d => d[c])
                unique.sort()
            } else {
                const tmp = bin().thresholds(5)(vals)
                unique = tmp.map(d => d.x0).concat(tmp.at(-1).x1)
            }
            this.stats[c] = {
                min: min(vals),
                max: max(vals),
                bins: unique,
                mean: mean(vals),
                median: median(vals),
                variance: variance(vals),
                deviation: deviation(vals),
            }
        })
        const app = useApp()
        app.updateData()
    }

    setLensData(data=[]) {
        this.lensData = data
        const app = useApp()
        app.updateLensData()
    }

    setLensTypes(types=[]) {
        this.lensTypes = types
    }

    setLensColumns(columns=[]) {
        this.lensColumns = columns
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