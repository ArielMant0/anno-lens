// Utilities
import { LENS_TYPE } from '@/use/Lens'
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
        name: "Games Tagging",
        file: "games.dr",
        x: "x",
        y: "y",
        color: "enact violence",
        type: DATA_TYPES.NOMINAL,
        ignore: ["name", "cluster"],
        meta: ["name"]
    },{
        name: "Cereal",
        file: "cereal.dr",
        x: "x",
        y: "y",
        color: "rating",
        type: DATA_TYPES.SEQUENTIAL,
        ignore: ["name"],
        meta: ["name"]
    }
]

export const useApp = defineStore('app', {
    state: () => ({
        dataset: "games.dr",
        datasetObj: Object.assign({}, DATASETS[0]),
        ready: false,

        refMode: "global",
        lensType: LENS_TYPE.RARE,

        activeLens: 0,
        colorIndex: 0,
        colorIndexSec: 0,

        mouseStill: false,
        moveLens: false,
        hoverX: 0,
        hoverY: 0,

        dataTime: 0,
        lensTime: 0,
        lensMoveTime: 0,
        annoTime: 0,
        featureTime: 0,

        showHotbar: true,
        showInventory: false,
        inventoryTime: 0
    }),

    getters: {
        datasetColor: state => state.datasetObj.colorAttr ? state.datasetObj.colorAttr : state.datasetObj.color,
        datasetColorType: state => state.datasetObj.type,
        datasetX: state => state.datasetObj.x,
        datasetY: state => state.datasetObj.y,
        columnIndex: state => state.activeLens === 0 ? state.colorIndex : state.colorIndexSec
    },

    actions: {

        setDataset(name) {
            const it = DATASETS.find(d => d.file === name)
            this.datasetObj = it
            this.dataset = name
        },

        setColor(name) {
            if (this.datasetObj) {
                this.datasetObj.color = name
            }
        },

        setColorIndex(lensIndex, columnIndex) {
            if (lensIndex === 0) {
                this.colorIndex = columnIndex
            } else {
                this.colorIndexSec = columnIndex
            }
        },

        updateData() {
            this.dataTime = Date.now()
        },

        updateLensData() {
            this.lensTime = Date.now()
        },
    }
})
