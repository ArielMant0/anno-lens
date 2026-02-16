import { mean } from "d3";
import { findInCircle, getAttr } from "../util";
import { makePolygon } from "./polygon";

let _SEL_ID = 1;

export const SELECTION_TYPE = Object.freeze({
    LENS: 1,
    LASSO: 2,
    BRUSH: 3,
})

class Selection {

    constructor(type, data=[]) {
        this.id = `sel_${_SEL_ID++}`
        this.type = type
        this.data = new Set(data)

        this.x = 0
        this.y = 0
        this.polygon = []
        this.centroid = []
    }

    calculatePolygon(data, xAttr, yAttr, x, y) {
        if (this.data.size > 0) {
            const xy = data.filter(d => this.data.has(d.id)).map(d => ([x(getAttr(d, xAttr)), y(getAttr(d, yAttr))]))
            const { polygon, centroid } = makePolygon(xy)
            this.x = mean(centroid, c => c[0]),
            this.y = mean(centroid, c => c[1])
            this.centroid = centroid
            this.polygon = polygon
        } else {
            this.x = 0
            this.y = 0
            this.centroid = []
            this.polygon = []
        }
    }

    filter(data) {
        return data.filter(d => this.data.has(d.id))
    }

    empty() {
        return this.data.length === 0
    }
}

export class LensSelection extends Selection {

    constructor(x=0, y=0, r=30, data=[]) {
        super(SELECTION_TYPE.LENS, data)
        this.update(x, y, r)
    }

    update(x, y, r) {
        this.x = x
        this.y = y
        this.r = r
    }

    apply(tree) {
        const points = findInCircle(tree, this.x, this.y, this.r)
        this.data = new Set(points.map(d => d.id))
    }
}


export class LassoSelection extends Selection {

    constructor(data=[], lasso=null) {
        super(SELECTION_TYPE.LASSO, data)
        this.lasso = []
    }
}