// Utilities
import { defineStore } from 'pinia'

export const DATA_TYPES = Object.freeze({
    SEQUENTIAL: 1,
    ORDINAL: 2,
    INTEGER: 3,
    QUANTILE: 4,
    BOOLEAN: 5,
    // SET: 6
})

export const DATASETS = [
    {
        name: "Iris Flowers",
        file: "iris.dr",
        x: "x",
        y: "y",
        color: "Species",
        type: DATA_TYPES.ORDINAL,
        ignore: [],
    },{
        name: "Games Tagging",
        file: "games.dr",
        x: "x",
        y: "y",
        color: "enact violence",
        type: DATA_TYPES.ORDINAL,
        ignore: ["name", "cluster"],
    },{
        name: "Heart Disease",
        file: "heart_disease_uci.dr",
        x: "x",
        y: "y",
        color: "sex",
        type: DATA_TYPES.ORDINAL,
        ignore: []
    },{
        name: "Anxiety Depression",
        file: "anxiety_depression.dr",
        x: "x",
        y: "y",
        color: "Gender",
        type: DATA_TYPES.ORDINAL,
        ignore: []
    },{
        name: "Cereal",
        file: "cereal.dr",
        x: "x",
        y: "y",
        color: "ratings",
        type: DATA_TYPES.SEQUENTIAL,
        ignore: ["grain_name", "producer"]
    }
]

export const useApp = defineStore('app', {
    state: () => ({
        dataset: "games.dr",
        datasetObj: DATASETS[1],

        dataTime: 0,
        lensTime: 0,
    }),

    getters: {
        datasetColor: state => state.datasetObj.colorAttr ? state.datasetObj.colorAttr : state.datasetObj.color,
        datasetColorType: state => state.datasetObj.type,
        datasetX: state => state.datasetObj.x,
        datasetY: state => state.datasetObj.y,
    },

    actions: {

        setDataset(name) {
            const it = DATASETS.find(d => d.file === name)
            this.datasetObj = it
            this.dataset = name
        },

        updateData() {
            this.dataTime = Date.now()
        },

        updateLensData() {
            this.lensTime = Date.now()
        },
    }
})
