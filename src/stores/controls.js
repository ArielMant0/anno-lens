import { capitalize } from '@/use/util'
import { schemeCategory10 } from 'd3'
import { defineStore } from 'pinia'

export const useControls = defineStore('controls', {
    state: () => ({
        mappings: new Array(10),
    }),

    actions: {

        getColor(index) {
            if (index >= 10) return "black"
            return schemeCategory10[index % 10]
        },

        format(key, modifier=null) {
            let str = modifier ? capitalize(modifier)+"+" : ""
            if (key.startsWith("Key")) {
                str += key.slice(3)
            } else if (key.startsWith("Digit")) {
                str += key.slice(5)
            }
            return str
        },

        setKeyMapping(index, key, label, callback, modifier=null) {
            if (index >= 10) return
            this.mappings[index] = {
                key: key,
                label: label,
                callback: callback,
                modifier: modifier,
                color: this.getColor(index)
            }
        },

        keyEvent(event) {
            const key = event.code
            const idx = this.mappings.findIndex(d => d && d.key === key)
            if (idx >= 0) {
                const m = this.mappings[idx]
                let execute = true;
                if (m.modifier !== null) {
                    execute = m.modifier === "shift" && event.shiftKey ||
                        m.modifier === "ctrl" && event.ctrlKey ||
                        m.modifier === "meta" && event.metaKey
                }

                if (execute) {
                    m.callback(m)
                }
            }
        }
    }
})
