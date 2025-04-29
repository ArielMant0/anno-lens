// Utilities
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
        color: "ratings",
        type: DATA_TYPES.SEQUENTIAL,
        ignore: ["grain_name", "producer"],
        meta: ["grain_name"]
    },{
        name: "Iris Flowers",
        file: "iris.dr",
        x: "x",
        y: "y",
        color: "Species",
        type: DATA_TYPES.NOMINAL,
        ignore: [],
    },{
        name: "Raisin",
        file: "raisin.dr",
        x: "x",
        y: "y",
        color: "Class",
        type: DATA_TYPES.NOMINAL,
        ignore: [],
    },{
        name: "IBM Employee Attrition",
        file: "ibm-employee-attrition-test.dr",
        x: "x",
        y: "y",
        color: "Attrition",
        type: DATA_TYPES.NOMINAL,
        ignore: ["Employee ID"],
        meta: ["Employee ID"]
    },{
        name: "Heart Disease",
        file: "heart_disease_uci.dr",
        x: "x",
        y: "y",
        color: "sex",
        type: DATA_TYPES.NOMINAL,
        ignore: []
    },{
        name: "Anxiety Depression",
        file: "anxiety_depression.dr",
        x: "x",
        y: "y",
        color: "Gender",
        type: DATA_TYPES.NOMINAL,
        ignore: [],
        types: {
            Social_Support_Score: DATA_TYPES.ORDINAL,
            Anxiety_Score: DATA_TYPES.ORDINAL,
            Therapy: DATA_TYPES.NOMINAL,
            Meditation: DATA_TYPES.NOMINAL,
            Financial_Stress: DATA_TYPES.ORDINAL,
            Work_Stress: DATA_TYPES.ORDINAL,
            Self_Esteem_Score: DATA_TYPES.ORDINAL,
            Life_Satisfaction_Score: DATA_TYPES.ORDINAL,
            Loneliness_Score: DATA_TYPES.ORDINAL,
            Chronic_Illnesses: DATA_TYPES.NOMINAL,
            Family_History_Mental_Illness: DATA_TYPES.NOMINAL
        }
    }
]

export const useApp = defineStore('app', {
    state: () => ({
        dataset: "games.dr",
        datasetObj: Object.assign({}, DATASETS[0]),

        activeLens: 0,
        colorIndex: 0,
        colorIndexSec: 0,

        moveLens: false,
        hoverX: 0,
        hoverY: 0,

        dataTime: 0,
        lensTime: 0,
        lensMoveTime: 0,
        annoTime: 0,
        featureTime: 0,

        showInventory: false,
        inventoryTime: 0
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
