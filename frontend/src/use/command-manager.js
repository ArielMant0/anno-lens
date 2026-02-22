import KeyMapping from "./key-mapping"

const COLORS4 = ["#ef476f", "#06d6a0", "#118ab2", "#ffd166"]
const COLORS5_1 = ["#390099", "#f15bb5", "#ff0054", "#ff5400", "#ffbd00"]
const COLORS5_2 = ["#619b8a", "#a1c181", "#f0b51d", "#fe8435", "#233d4d"]


class CommandManager {
    
    constructor(size=5, colors=COLORS5_2) {
        this.size = size
        this.colors = colors
        this.mappings = new Array(this.size*2)

        this.targets = []
    }

    getColor(index) {
        if (index >= this.mappings.length) return "black"
        return this.colors[(index-this.size) % this.mappings.length]
    }

    getKeyMapping(index) {
        return this.mappings[index]
    }

    getKeyMappingFromHotkey(key, modifiers=[], ignoreIndex=[]) {
        return this.mappings.find((d, i) => !ignoreIndex.includes(i) && d.matches(key, modifiers))
    }

    setKeyMapping(index, mapping) {
        this.mappings[index] = mapping
    }

    addKeyMapping(index, key, label, command, modifiers=[]) {
        if (index < this.size || index >= this.mappings.length) return
        this.mappings[index] = new KeyMapping(
            index,
            key,
            label,
            command,
            modifiers,
            false,
            this.getColor(index)
        )
    }

    addKeyMappingLocked(index, key, label, command, modifiers=[]) {
        if (index < 0 || index >= this.size) return
        this.mappings[index] = new KeyMapping(
            index,
            key,
            label,
            command,
            modifiers,
            true,
            null
        )
    }

    get numTargets() {
        return this.targets.length
    }

    getTargets() {
        return this.targets
    }

    clearTargets() {
        this.targets = []
    }

    addTarget(target) {
        if (Array.isArray(target)) {
            this.targets = this.targets.concat(target)
        } else {
            this.targets.push(target)
        }
    }

}

const CM = new CommandManager()

export { CM as default }