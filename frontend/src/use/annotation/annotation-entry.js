let _ENTRY_ID = 1;

export const ENTRY_TYPE = Object.freeze({
    DATAPOINT: 1,
    COLUMN: 2,
    ANNOTATION: 3,
})

export const ANNO_SOURCE = Object.freeze({
    USER: 1,
    AI: 2,
});

export const ANNO_TYPE = Object.freeze({
    TEXT: 1,
    VIS: 2,
});

class AnnotationEntry {

    constructor(annotation, type, src) {
        this._anno = annotation
        this.id = `entry_${_ENTRY_ID++}`
        this.type = type
        this.source = src
        this.time = Date.now()
    }

    update() {
        throw new Error("called abstract function")
    }
}

export class TextEntry extends AnnotationEntry {

    constructor(annotation, text, src, entities=[]) {
        super(annotation, ANNO_TYPE.TEXT, src)
        this.text = text
        this.entities = entities
    }

    update(text, entities=[]) {
        this.text = text
        this.entities = entities
    }

    addText(text) {
        this.text += text
    }

    addEntities(entities) {
        const tmp = this.entities.concat(entities)
        const entitySet = new Set()
        this.entities = tmp.filter(d => {
            if (entitySet.has(d.id)) {
                return false
            }
            entitySet.add(d.id)
            return true
        })
    }
}