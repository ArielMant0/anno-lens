import { AnnotationEntry, TextEntry } from "./annotation-entry"

export const ACTION_TARGET = Object.freeze({
    DATA: "at-data",
    VIS: "at-vis",
    ANNOTATION: "at-anno"
})

export const ALL_ACTION_TARGETS = [
    ACTION_TARGET.DATA,
    ACTION_TARGET.VIS,
    ACTION_TARGET.ANNOTATION
]

export class TargetData {

    constructor(type, target, description=null) {
        this.type = type
        this.target = target
        this.description = description
    }

    describe() {
        let label = null, data = null, desc = this.description, img = null

        switch(this.type) {
            case ACTION_TARGET.DATA:
                label = "data points"
                if (this.target instanceof Lens) {
                    // TODO: pass only a few instances and stats instead?
                    data = this.target.getResultData()
                } else {
                    // otherwise: assume this is already the data of interest
                    data = this.target
                }
                break
            case ACTION_TARGET.ANNOTATION:
                label = "annotation"
                console.assert(this.target instanceof AnnotationEntry, "target should be an annotation entry")
                data = this.target.annotation.getData()
                if (this.target instanceof TextEntry) {
                    desc = this.target.text
                }
                break
            case ACTION_TARGET.VIS:
                label = "visualization"
                // assume that target is some kind of image representation
                img = target
                break
        }

        return {
            label: label,
            description: desc,
            data: data,
            image: img
        }
    }
}
