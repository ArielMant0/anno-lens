import { ENTITY_TYPE } from "./entity"

let _ANNO_ID = 1

export default class Annotation {

    constructor(data, selection, label="Annotation") {
        this.id = `anno_${_ANNO_ID++}`
        this.label = label
        this.data = new Set(data)
        this.entries = []
        this.timeCreated = Date.now()
        this.timeUpdated = this.timeCreated

        this.selection = selection
        this.color = "red"
    }

    get polygon() {
        return this.selection[0].polygon
    }

    get centroid() {
        return this.selection[0].centroid
    }

    get x() {
        return this.selection[0].x
    }

    get y() {
        return this.selection[0].y
    }

    update(time=null) {
        time = time ? time : Date.now()
        if (time > this.timeUpdated) {
            this.timeUpdated = time
        }
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