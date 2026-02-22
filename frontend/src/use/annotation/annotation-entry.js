let _ENTRY_ID = 1;

export const ENTRY_SOURCE = Object.freeze({
    USER: 1,
    AI: 2,
});

export const ENTRY_TYPE = Object.freeze({
    TEXT: 1,
    VIS: 2,
});

export class AnnotationEntry {

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
        super(annotation, ENTRY_TYPE.TEXT, src)
        this.text = text
        this.entities = []
        this.addEntities(entities, false)
    }

    update(text, entities=[]) {
        this.text = text
        this.addEntities(entities)
    }

    hasEntity(type, id) {
        return this.entities.some(d => d.type === type && d.id === id)
    }

    addText(text) {
        this.text += text
    }

    addEntities(entities, update=true) {
        const before = this.entities.length
        const tmp = this.entities.concat(entities)
        const entitySet = {}
        this.entities = tmp.filter(d => {
            // create empty set for this type of entity
            if (!entitySet[d.type]) {
                entitySet[d.type] = new Set()
            }
            // entity already exists
            if (entitySet[d.type].has(d.id)) {
                return false
            }
            // add this entity to the list
            entitySet[d.type].add(d.id)
            return true
        })

        if (update && this.entities.length !== before) {
            this._anno.update()
        }
    }

    removeEntity(id, type) {
        const index = this.entities.find(d => d.type === type && d.id === id)
        if (index >= 0) {
            this.entities.splice(index, 1)
            this._anno.update()
        }
    }
}