export const ENTITY_TYPE = Object.freeze({
    DATAPOINT: 1,
    COLUMN: 2,
    ANNOTATION: 3,
})

class Entity {

    constructor(type, id) {
        this.type = type
        this.id = id
    }
}

export class DatapointEntity extends Entity {

    constructor(id) {
        super(ENTITY_TYPE.DATAPOINT, id)
    }
}

export class ColumnEntity extends Entity {

    constructor(id, name=id, value=null) {
        super(ENTITY_TYPE.COLUMN, id)
        this.name = name
        this.value = value
    }
}

export class AnnotationEntity extends Entity {

    constructor(id) {
        super(ENTITY_TYPE.ANNOTATION, id)
    }
}