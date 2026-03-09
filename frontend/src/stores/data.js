import { defineStore } from 'pinia'

export const DATA_TYPES = Object.freeze({
    SEQUENTIAL: 1,
    ORDINAL: 2,
    NOMINAL: 3,
    INTEGER: 4,
    QUANTILE: 5,
    BOOLEAN: 6,
    // SET: 7
})

export const DATASETS = [
    {
        id: 1,
        name: "cereals",
        x: "x",
        y: "y",
        color: "rating",
        type: DATA_TYPES.SEQUENTIAL,
        ignore: ["name"],
        meta: ["name"],
        types: {
            // "calories": DATA_TYPES.INTEGER,
            // "protein": DATA_TYPES.INTEGER,
            // "fat": DATA_TYPES.INTEGER,
            // "sodium": DATA_TYPES.INTEGER,
            // "sugars": DATA_TYPES.INTEGER,
            // "potassium": DATA_TYPES.INTEGER,
            // "vitamins & minerals": DATA_TYPES.INTEGER,
            "display_shelf": DATA_TYPES.ORDINAL,
        }
    }
]

export function convertDType(dtype) {
    switch(dtype.toLowerCase()) {
        default:
        case "float":
        case "double":
        case "number":
            return DATA_TYPES.SEQUENTIAL
        case "integer":
            return DATA_TYPES.INTEGER
        case "string":
            return DATA_TYPES.NOMINAL
        case "bool":
        case "boolean":
            return DATA_TYPES.BOOLEAN
    }
}

export const useData = defineStore('data', {
    state: () => ({
        ready: false,

        datasets: [],
        dataset: null,
        datasetId: null,

        loadTime: {},
        reloadTime: {},
    }),

    getters: {
        hasDatasets: state => state.datasets.length > 0,
        datasetColor: state => {
            if (state.dataset) {
                return state.dataset.colorAttr ?
                    state.dataset.colorAttr :
                    state.dataset.color
            }
            return null
        },
        datasetX: state => state.dataset ? state.dataset.x : null,
        datasetY: state => state.dataset ? state.dataset.y : null,
    },

    actions: {

        setReady(value) {
            this.ready = value === true
        },

        setDatasets(datasets) {
            this.datasets = datasets
            if (!this.dataset && datasets.length > 0) {
                this.setDataset(datasets.at(0).id)
            }
        },

        setDataset(id) {
            const ds = DATASETS.find(d => d.id === id)
            if (ds) {
                this.dataset = ds
                this.datasetId = id
            }
        },

        setColor(name) {
            if (this.dataset) {
                this.dataset.color = name
            }
        },

        setReloadTime(name) {
            this.reloadTime[name] = Date.now()
        },

        setLoadTime(name) {
            this.loadTime[name] = Date.now()
        }
    }
})
