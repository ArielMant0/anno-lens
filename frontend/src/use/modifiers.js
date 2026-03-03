import { interpolateViridis, scaleSequential } from "d3"
import { getAttr } from "./util"
import { Entity, ENTITY_TYPE } from "./annotation/entity"

export const MODIFIER_TYPE = Object.freeze({
    COLOR_FUNCTION: "_mod_col",
})
export const MODIFIER_COLUMNS = Object.values(MODIFIER_TYPE)

let _MOD_ID = 1

export class Modifier {

    constructor(type) {
        this.id = `mod_${_MOD_ID++}`
        this.type = type
    }

    /**
     * Apply the modifier to a datapoint
     */
    apply() {}

}

const DEFAULT_CF_OPTIONS = Object.freeze({
    scale: scaleSequential,
    colors: interpolateViridis,
    domain: [0, 1]
})

export class ColorFunctionModifier extends Modifier {

    /**
     * Create a new color function modifier that creates a colormap based
     * on column weights (or sth else?)
     * @param {Entity[]} entities
     * @param {Function} colors
     */
    constructor(entities, options=DEFAULT_CF_OPTIONS) {
        super(MODIFIER_TYPE.COLOR_FUNCTION)
        this.entities = entities
        this.options = Object.assign(Object.assign({}, DEFAULT_CF_OPTIONS), options)
        this.colormap = this.options.scale(this.options.colors).domain(this.options.domain)
    }

    getColormap() {
        return this.colormap
    }

    apply(d) {
        let value = 0

        // color points based on a weighted linear combination of their feature values
        if (this.entities.length > 0 && this.entities.at(0).type === ENTITY_TYPE.COLUMN) {
            value = this.entities.reduce((acc, c) => acc + getAttr(d, c.name) * c.value, 0)
        }

        // assign color to datapoint
        d[this.type] = value

        return value
    }
}