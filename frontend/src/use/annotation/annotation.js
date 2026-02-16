let _ANNO_ID = 1

export default class Annotation {

    constructor(data=[]) {
        this.id = `anno_${_ANNO_ID++}`
        this.data = data
        this.entries = []
        this.timeCreated = Date.now()
        this.timeUpdated = this.timeCreated
    }

    update(time) {
        if (time > this.timeUpdated) {
            this.timeUpdated = time
        }
    }

    addEntry(entry) {
        this.entries.push(entry)
    }

    removeEntry(id) {
        const idx = this.entries.findIndex(d => d.id === id)
        if (idx >= 0) {
            this.entries.splice(idx, 1)
        }
    }
}