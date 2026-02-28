let _EID = 1

export const ENTITY_TYPE = Object.freeze({
    DATAPOINT: "dp",
    SELECTION: "sel",
    COLUMN: "col",
    ANNOTATION: "anno",
})

export function entityTypeToValue(type) {
    switch(type) {
        case ENTITY_TYPE.ANNOTATION: return 1
        case ENTITY_TYPE.COLUMN: return 2
        case ENTITY_TYPE.SELECTION: return 3
        default:
        case ENTITY_TYPE.DATAPOINT: return 4
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


export class SelectionEntity extends Entity {

    constructor(data, name=data, selection=null) {
        super(ENTITY_TYPE.SELECTION, data)
        this.name = name
        this.selection = selection
    }
}

export class DatapointEntity extends Entity {

    constructor(data, values=null) {
        super(ENTITY_TYPE.DATAPOINT, data)
        this.values = values
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

    constructor(data, name=data, annotation=null) {
        super(ENTITY_TYPE.ANNOTATION, data)
        this.name = name
        this.annotation = annotation
    }
}