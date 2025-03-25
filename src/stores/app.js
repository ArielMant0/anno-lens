// Utilities
import { defineStore } from 'pinia'

export const useApp = defineStore('app', {
    state: () => ({
        datasetX: "SepalLengthCm",
        datasetY: "PetalLengthCm",
        datasetColor: "Species",
        dataset: "iris",
    }),

    actions: {

        setDataset(name) {
            switch(name) {
                case "iris":
                    this.datasetX = "SepalLengthCm"
                    this.datasetY = "PetalLengthCm"
                    this.datasetColor = "Species"
                    break;
                case "heart_disease_uci":
                    this.datasetX = "trestbps"
                    this.datasetY = "chol"
                    this.datasetColor = "sex"
                    break;
            }
            this.dataset = name
        }
    }
})
