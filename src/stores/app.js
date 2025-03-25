// Utilities
import { defineStore } from 'pinia'

export const useApp = defineStore('app', {
    state: () => ({
        datasetX: "SepalLengthCm",
        datasetY: "PetalLengthCm",
        datasetColor: "Species",
        colorType: "ordinal",
        dataset: "iris",
    }),

    actions: {

        setDataset(name) {
            switch(name) {
                case "iris":
                    this.datasetX = "SepalLengthCm"
                    this.datasetY = "PetalLengthCm"
                    this.datasetColor = "Species"
                    this.colorType = "ordinal"
                    break;
                case "heart_disease_uci":
                    this.datasetX = "trestbps"
                    this.datasetY = "chol"
                    this.datasetColor = "sex"
                    this.colorType = "ordinal"
                    break;
                case "pollution":
                    this.datasetX = "temp"
                    this.datasetY = "press"
                    this.datasetColor = "pollution"
                    this.colorType = "sequential"
                    break;
            }
            this.dataset = name
        }
    }
})
