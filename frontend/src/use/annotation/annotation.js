import { mean } from "d3"
import DM from "../data-manager"
import { ENTITY_TYPE } from "./entity"

let _ANNO_ID = 1

export default class Annotation {

    constructor(data, selections=[], title="Annotation", label="A1") {
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
        return this.selections.length > 0 ?
            this.selections.map(s => s.polygon).flat() :
            null
    }

    get centroid() {
        return this.selections.length > 0 ?
            this.selections.map(s => s.centroid).flat() :
            null
    }

    get x() {
        return this.selections.length > 0 ?
            mean(this.selections, s => s.x) :
            null
    }

    get y() {
        return this.selections.length > 0 ?
            mean(this.selections, s => s.y) :
            null
    }

    get hasSelection() {
        return this.selections.length > 0
    }

    hasDataOverlap(otherIds) {
        return this.data.intersection(otherIds).size > 0
    }

    hasColumn(column) {
        return this.entries.some(d => d.hasEntity(ENTITY_TYPE.COLUMN, column))
    }

    update(time=null) {
        time = time ? time : Date.now()
        if (time > this.timeUpdated) {
            this.timeUpdated = time
            DM.trigger("anno")
        }
    }

    getData() {
        if (this.data.size === 0) return []
        return DM.getDataBy(d => this.data.has(d.id))
    }

    getTitle() {
        return this.title
    }

    setTitle(title, update=true) {
        this.title = title
        if (update) this.update()
    }

    getSelectionIds() {
        return this.selections.map(s => s.id)
    }

    getSelections() {
        return this.selections
    }

    /**
     * Add a new selection to this annotation
     * @param {Selection} selection 
     * @param {Boolean} update 
     */
    addSelection(selection, update=true) {
        // add selection noly if it does not yet exist
        if (!this.selections.find(d => d.id === selection.id)) {
            this.selections.push(selection)
            this.data = selection.union(this.data)
            if (update) this.update()
        }
    }

    /**
     * Remove the selection with the given id
     * @param {String} id 
     * @param {Boolean} update 
     */
    removeSelection(id, update=true) {
        const idx = this.selections.findIndex(d => d.id === id)
        if (idx >= 0) {
            const [removed] = this.selections.splice(idx, 1)
            this.data = this.data.difference(removed.data)
            if (update) this.update()
        }
    }

    getEntry(id) {
        return this.entries.find(d => d.id === id)
    }

    /**
     * Add a new entry to this annotation
     * @param {Entry} entry 
     */
    addEntry(entry, update=true) {
        if (!this.entries.find(d => d.id === entry.id)) {
            this.entries.push(entry)
            DM.onAddEntry(entry)
            if (update) this.update()
        }
    }

    /**
     * Remove the entry with the given id, if it exists
     * @param {String} id 
     * @param {Boolean} update 
     */
    removeEntry(id, update=true) {
        const idx = this.entries.findIndex(d => d.id === id)
        if (idx >= 0) {
            const [entry] = this.entries.splice(idx, 1)
            DM.onRemoveEntry(entry)
            if (update) this.update()
        }
    }
}