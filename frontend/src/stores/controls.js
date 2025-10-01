import { capitalize } from '@/use/util'
import { defineStore } from 'pinia'

function isValidKey(key) {
    return new RegExp(/\w/, "i").test(key)
}

const COLORS4 = ["#ef476f", "#06d6a0", "#118ab2", "#ffd166"]
const COLORS5_1 = ["#390099", "#f15bb5", "#ff0054", "#ff5400", "#ffbd00"]
const COLORS5_2 = ["#619b8a", "#a1c181", "#f0b51d", "#fe8435", "#233d4d"]

export const SIZE = 5

export const useControls = defineStore('controls', {
    state: () => ({
        mappings: new Array(SIZE*2),
        recording: false,
        recordMessage: "",
        recordTarget: null,
        recordLabel: null,
        recordCallback: null,
        trigger: null
    }),

    actions: {

        getColor(index) {
            if (index >= this.mappings.length) return "black"
            return COLORS5_2[(index-SIZE) % this.mappings.length]
        },

        format(key, modifiers=[]) {
            let str = modifiers.reduce((acc, m) => acc + capitalize(m)+"+", "")
            if (key.startsWith("Arrow")) {
                str += key.slice(5)
            } else  {
                str += key
            }
            return str
        },

        formatArray(key, modifiers=[]) {
            const array = modifiers.map(m => capitalize(m)+"+")
            if (key.startsWith("Arrow")) {
                array.push(capitalize(key.slice(5)))
            } else  {
                array.push(capitalize(key))
            }
            return array
        },

        setKeyMapping(index, key, label, callback, modifiers=[]) {
            if (index < SIZE || index >= this.mappings.length) return
            this.mappings[index] = {
                id: index,
                key: key,
                label: label,
                callback: callback,
                modifiers: modifiers,
                locked: false,
                color: this.getColor(index)
            }
        },

        setKeyMappingLocked(index, key, label, callback, modifiers=[]) {
            if (index < 0 || index >= SIZE) return
            this.mappings[index] = {
                id: index,
                key: key,
                label: label,
                callback: callback,
                modifiers: modifiers,
                locked: true,
            }
        },

        mappingFromHotkey(key, modifiers=[], ignoreIndex=[]) {
            return this.mappings.find((d, i) => !ignoreIndex.includes(i) &&
                (key === d.key || key.toLowerCase() === d.key) &&
                modifiers.length === d.modifiers.length &&
                modifiers.every(m => d.modifiers.includes(m)) &&
                d.modifiers.every(m => modifiers.includes(m))
            )
        },

        keyEvent(event) {
            if (document.activeElement && document.activeElement.tagName === "INPUT") return
            if (!isValidKey(event.key)) return

            if (this.recording) {
                return this.recordHotkey(event)
            }

            const mods = [
                event.ctrlKey ? "ctrl" : null,
                event.shiftKey ? "shift" : null,
                event.metaKey ? "meta" : null,
            ].filter(d => d !== null)

            const m = this.mappingFromHotkey(event.key, mods)
            if (m) {
                event.preventDefault();
                m.callback(m)
                this.trigger = m.id
                setTimeout(() => this.trigger = null, 500)
            } else {
                this.trigger = null
            }
        },

        recordHotkey(event) {
            if (this.recordTarget !== null) {
                const key = event.key
                // cancel if user presses escape
                if (key === "Escape") {
                    this.recording = false
                    this.recordMessage = ""
                    this.recordTarget = null
                    this.recordLabel = null
                    this.recordCallback = null
                    return
                }
                // cancel if not a valid key (like only shift or control)
                if (key.length > 1 || !isValidKey(key)) return

                let m;
                if (this.mappings[this.recordTarget]) {
                    m = Object.assign({}, this.mappings[this.recordTarget])
                } else {
                    m = {}
                }

                m.key = key
                m.modifiers = []
                if (event.ctrlKey) {
                    m.modifiers.push("ctrl")
                }
                if (event.shiftKey) {
                    m.modifiers.push("shift")
                }
                if (event.metaKey) {
                    m.modifiers.push("meta")
                }

                const existing = this.mappingFromHotkey(key, m.modifiers, [this.recordTarget])
                if (existing) {
                    if (existing.locked) {
                        this.recordMessage = "locked hotkey already assigned"
                        return
                    }
                    existing.key = null
                }

                this.mappings[this.recordTarget] = m

                this.recording = false
                this.recordMessage = ""
                this.recordTarget = null
                this.recordLabel = null
                this.recordCallback = null
            }
        },

        startRecordHotkey(index, label, callback) {
            // ignore locked hotkeys
            if (index < SIZE) return;
            this.recordTarget = index
            this.recordLabel = label
            this.recordCallback = callback
            this.recordMessage = "press your desired hotkey now"
            this.recording = true
        }
    }
})
