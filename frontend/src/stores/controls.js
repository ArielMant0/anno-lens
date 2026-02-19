import { capitalize } from '@/use/util'
import { defineStore } from 'pinia'

function isValidKey(key) {
    return new RegExp(/\w/, "i").test(key)
}

const COLORS4 = ["#ef476f", "#06d6a0", "#118ab2", "#ffd166"]
const COLORS5_1 = ["#390099", "#f15bb5", "#ff0054", "#ff5400", "#ffbd00"]
const COLORS5_2 = ["#619b8a", "#a1c181", "#f0b51d", "#fe8435", "#233d4d"]

export const SIZE = 5

export class KeyMapping {

    constructor(index, key, label, callback, modifiers=[], locked=false, color=null, maxTargets=0, targetTypes=[]) {
        this.id = index
        this.key = key
        this.label = label
        this.maxTargets = maxTargets
        this.targetTypes = targetTypes
        this.callback = callback
        this.modifiers = modifiers
        this.locked = locked
        this.color = color
    }

    copy() {
        return new KeyMapping(
            this.index,
            this.key,
            this.label,
            this.callback,
            this.modifiers.slice(),
            this.locked,
            this.color,
            this.maxTargets,
            this.targetTypes.slice()
        )
    }

    lock() {
        this.locked = true
    }

    unlock() {
        this.locked = false
    }

    matches(key, modifiers) {
        return (key === this.key || key.toLowerCase() === this.key) &&
            modifiers.length === this.modifiers.length &&
            modifiers.every(m => this.modifiers.includes(m)) &&
            this.modifiers.every(m => modifiers.includes(m))
    }

    isValidTarget(type) {
        if (this.targetTypes.length === 0 || this.maxTargets === 0) return true
        return this.targetTypes.includes(type)
    }

    execute(args) {
        this.callback(args)
    }
}

export const useControls = defineStore('controls', {
    state: () => ({
        mappings: new Array(SIZE*2),
        activeMapping: null,
        activeMappingId: null,
        activeTargets: [],

        recording: false,
        recordMessage: "",
        recordTarget: null,
        recordLabel: null,
        recordCallback: null,
        trigger: null
    }),

    getters: {
        hasActive: state => state.activeMapping !== null,
        canTarget: state => state.activeMapping !== null && state.activeMapping.maxTargets > state.activeTargets.length
    },

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

        setKeyMapping(index, key, label, callback, modifiers=[], maxTargets=0, targetTypes=[]) {
            if (index < SIZE || index >= this.mappings.length) return
            this.mappings[index] = new KeyMapping(
                index,
                key,
                label,
                callback,
                modifiers,
                false,
                this.getColor(index),
                maxTargets,
                targetTypes
            )
        },

        setKeyMappingLocked(index, key, label, callback, modifiers=[], maxTargets=0, targetTypes=[]) {
            if (index < 0 || index >= SIZE) return
            this.mappings[index] = new KeyMapping(
                index,
                key,
                label,
                callback,
                modifiers,
                true,
                null,
                maxTargets,
                targetTypes
            )
        },

        mappingFromHotkey(key, modifiers=[], ignoreIndex=[]) {
            return this.mappings.find((d, i) => !ignoreIndex.includes(i) && d.matches(key, modifiers))
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
                event.preventDefault()
                // reset targets if we click a different key while another is still active
                if (this.activeMapping !== null) {
                    this.activeTargets = []
                }
                this.trigger = m.id
                setTimeout(() => this.trigger = null, 500)
                // set this to the active mapping
                this.activeMapping = m
                this.activeMappingId = m.id
                // if no targets are allowed, execute immediately
                if (m.maxTargets === 0) {
                    this.executeActive()
                }
            }
        },

        targetEvent(target, targetType) {
            if (this.hasActive) {
                // only do sth if this is a valid target
                if (this.activeMapping.isValidTarget(targetType)) {
                    if (this.activeTargets.length < this.activeMapping.maxTargets) {
                        if (Array.isArray(target)) {
                            this.activeTargets = this.activeTargets.concat(target)
                        } else {
                            this.activeTargets.push(target)
                        }
                        // trigger immediately if we reached the maximum number of targets
                        if (this.activeTargets.length === this.activeMapping.maxTargets) {
                            this.executeActive()
                        }
                    } else {
                        this.executeActive()
                    }
                }
            }
        },

        executeActive() {
            if (this.hasActive) {
                // execute callback with selected targets
                this.activeMapping.execute(this.activeTargets)
                this.activeTargets = []
                this.activeMapping = null
                this.activeMappingId = null
            }
        },

        cancelActive() {
            if (this.hasActive) {
                this.activeTargets = []
                this.activeMapping = null
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
                    m = this.mappings[this.recordTarget].copy()
                } else {
                    m = new KeyMapping(
                        this.recordTarget,
                        key,
                        this.recordLabel,
                        this.recordCallback
                    )
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
