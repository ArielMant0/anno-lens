import { Selection } from "../selection/selection"

export const ACTION_TARGET = Object.freeze({
    SELECTION: "at-sel",
    VIS: "at-vis",
    ANNOTATION: "at-anno",
    COLUMN: "at-col",
    DATAPOINT: "at-dp"
})

export const ALL_ACTION_TARGETS = [
    ACTION_TARGET.SELECTION,
    ACTION_TARGET.VIS,
    ACTION_TARGET.ANNOTATION,
    ACTION_TARGET.COLUMN,
    ACTION_TARGET.DATAPOINT,
]

let _TDID = 1

export class TargetData {

    constructor(entities, type, annotation=null) {
        this.id = `td_${_TDID++}`
        this.entities = entities
        this.type = type
        this.annotation = annotation
    }

    get multiple() {
        return this.entities.length > 1
    }

    getEntities() {
        return this.multiple ? this.entities : this.entities.at(0)
    }

    getData() {
        return this.entities.map(d => d.data)
    }

    getSelection() {
        if (this.type === ACTION_TARGET.SELECTION) {
            return this.multiple ?
                Selection.dataUnion(this.entities.map(d => d.selection)) :
                this.entities.at(0).selection
        }
        return null
    }

    removeEntity(id) {
        const idx = this.entities.findIndex(d => d.id === id)
        if (idx >= 0) {
            this.entities.splice(idx, 1)
        }
    }
}
