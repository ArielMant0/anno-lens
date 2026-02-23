let _EID = 1

export const ENTITY_TYPE = Object.freeze({
    DATAPOINT: "dp",
    COLUMN: "col",
    ANNOTATION: "anno",
})

export function entityTypeToValue(type) {
    switch(type) {
        case ENTITY_TYPE.ANNOTATION: return 1
        case ENTITY_TYPE.COLUMN: return 2
        default:
        case ENTITY_TYPE.DATAPOINT: return 3
    }
}

export function compareEntityType(a, b) {
    return entityTypeToValue(a) - entityTypeToValue(b)
}

export class Entity {

    constructor(type, data) {
        this.id = `${type}_${_EID++}`
        this.type = type
        this.data = data
    }
}

export class DatapointEntity extends Entity {

    constructor(data) {
        super(ENTITY_TYPE.DATAPOINT, data)
    }
}

export class ColumnEntity extends Entity {

    constructor(data, name=data, value=null) {
        super(ENTITY_TYPE.COLUMN, data)
        this.name = name
        this.value = value
    }
}

export class AnnotationEntity extends Entity {

    constructor(data) {
        super(ENTITY_TYPE.ANNOTATION, data)
    }
}