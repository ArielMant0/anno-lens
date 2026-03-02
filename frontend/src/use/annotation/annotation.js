import DM from "../data-manager"
import { ENTITY_TYPE } from "./entity"

let _ANNO_ID = 1

export default class Annotation {

    constructor(data, selections, title="Annotation", label="A1") {
        this.id = `anno_${_ANNO_ID++}`
        this.title = title
        this.label = label
        this.data = new Set(data)
        this.entries = []
        this.timeCreated = Date.now()
        this.timeUpdated = this.timeCreated

        this.selections = selections
        this.color = "#3996d4"
    }

    get polygon() {
        return this.selections[0].polygon
    }

    get centroid() {
        return this.selections[0].centroid
    }

    get x() {
        return this.selections[0].x
    }

    get y() {
        return this.selections[0].y
    }

    getData() {
        return DM.getDataBy(d => this.data.has(d.id))
    }

    getSelectionIds() {
        return this.selections.map(s => s.id)
    }

    getSelections() {
        return this.selections
    }

    update(time=null) {
        time = time ? time : Date.now()
        if (time > this.timeUpdated) {
            this.timeUpdated = time
            DM.trigger("anno")
        }
    }

    getEntry(id) {
        return this.entries.find(d => d.id === id)
    }

    addEntry(entry) {
        this.entries.push(entry)
    }

    removeEntry(id) {
        const idx = this.entries.findIndex(d => d.id === id)
        if (idx >= 0) {
            this.entries.splice(idx, 1)
        }
    }

    hasDataOverlap(otherIds) {
        return this.data.intersection(otherIds).size > 0
    }

    hasColumn(column) {
        return this.entries.some(d => d.hasEntity(ENTITY_TYPE.COLUMN, column))
    }

}