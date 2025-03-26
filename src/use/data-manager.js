import { useApp } from "@/stores/app"

class DataManager {

    constructor() {
        this.data = []
        this.lensData = []
        this.lensTypes = []
        this.lensColumns = []
        this.scales = {}
    }

    setData(data=[]) {
        this.data = data
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