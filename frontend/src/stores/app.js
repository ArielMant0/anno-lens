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
        type: DATA_TYPES.BOOLEAN,
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
        meta: ["name"],
        types: {
            // "calories": DATA_TYPES.INTEGER,
            // "protein": DATA_TYPES.INTEGER,
            // "fat": DATA_TYPES.INTEGER,
            // "sodium": DATA_TYPES.INTEGER,
            // "sugars": DATA_TYPES.INTEGER,
            // "potassium": DATA_TYPES.INTEGER,
            // "vitamins & minerals": DATA_TYPES.INTEGER,
            "display shelf": DATA_TYPES.ORDINAL,
        }
    }
]

export const useApp = defineStore('app', {
    state: () => ({
        dataset: "cereal.dr",
        datasetObj: Object.assign({}, DATASETS[1]),
        ready: false,

        useChat: false,

        refMode: "global",
        lensType: LENS_TYPE.RARE,

        numSelections: 0,

        activeLens: 0,
        colorOverride: "",
        colorIndex: 0,
        colorIndexSec: 0,
        scales: {},

        moveLens: false,
        hoverX: 0,
        hoverY: 0,

        dataTime: 0,
        lensTime: 0,
        lensMoveTime: 0,
        annoTime: 0,
        featureTime: 0,
        selectionTime: 0,
        hoverTime: 0,
        chatTime: 0,

        showHotbar: true,
        showInventory: false,
        inventoryTime: 0,

        llmLoading: false,
        initialized: false,

        hovered: new Map(),
        showTargetOverlay: false,
        showHoverOverlay: false,
    }),

    getters: {
        datasetColor: state => state.datasetObj.colorAttr ? state.datasetObj.colorAttr : state.datasetObj.color,
        datasetX: state => state.datasetObj.x,
        datasetY: state => state.datasetObj.y,
        columnIndex: state => state.activeLens === 0 ? state.colorIndex : state.colorIndexSec,
        hasHoveredEntity: state => state.hovered.size > 0
    },

    actions: {

        setInitialized() {
            this.initialized = true
        },

        setDataset(name) {
            const it = DATASETS.find(d => d.file === name)
            this.datasetObj = it
            this.dataset = name
        },

        setChat(value) {
            this.useChat = value === true
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

        setColorOverride(name="") {
            if (this.colorOverride !== name) {
                this.colorOverride = name
            }
        },

        updateData() {
            this.dataTime = Date.now()
        },

        updateLensData() {
            this.lensTime = Date.now()
            this.selectionTime = this.lensTime
        },

        updateChat() {
            this.chatTime = Date.now()
        },

        setLLMLoading(value) {
            this.llmLoading = value === true
        },

        isHoveredEntity(entityId) {
            return this.hovered.has(entityId)
        },

        setHoverEntity(entityId, data) {
            if (!this.isHoveredEntity(entityId)) {
                this.hovered.set(entityId, data)
                this.hoverTime = Date.now()
            }
        },

        unsetHoverEntity(entityId) {
            if (this.isHoveredEntity(entityId)) {
                this.hovered.delete(entityId)
                this.hoverTime = Date.now()
            }
        },

        toggleHoverEntity(entityId, data) {
            if (this.isHoveredEntity(entityId)) {
                this.setHoverEntity(entityId, data)
            } else {
                this.unsetHoverEntity(entityId)
            }
        }
    }
})
