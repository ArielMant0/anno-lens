<template>
    <div class="d-flex align-center justify-space-between">
        <v-card v-for="data in derived" :key="data.columnName" density="compact" :style="{ border: '2px solid white' }">
            <div v-if="disabled" :style="{ width: width+'px', height: (height+27)+'px' }" class="d-flex align-center justify-center">
                <v-icon size="50">mdi-cancel</v-icon>
            </div>
            <div v-else>
                <div style="text-align: center; vertical-align: middle;" :style="{ maxWidth: width+'px' }" class="text-caption text-dots">
                    {{ data.columnName }}
                </div>
                <BarChart
                    :data="data.values"
                    x-attr="x"
                    y-attr="y"
                    :y-domain="data.domain"
                    color-attr="color"
                    :width="width"
                    :height="height" />
            </div>
        </v-card>
    </div>
</template>

<script setup>
    import { onMounted, watch } from 'vue';
    import BarChart from './vis/BarChart.vue';
    import { DATA_TYPES } from '@/stores/app';
    import DM from '@/use/data-manager';
    import { max } from 'd3';

    const props = defineProps({
        lens: {
            type: Number,
            required: true
        },
        indices: {
            type: Array,
            required: true
        },
        mode: {
            type: String,
            required: true
        },
        time: {
            type: Number,
            required: true
        },
        width: {
            type: Number,
            default: 200
        },
        height: {
            type: Number,
            default: 100
        },
        disabled: {
            type: Boolean,
            default: false
        }
    })

    const derived = ref([])

    function init() {
        if (!DM.lensResults[props.lens] || !DM.lensResults[props.lens][props.mode]) return
        const columns = props.indices.map(i => DM.lensResults[props.lens][props.mode][i].name)

        if (columns.some(c => !DM.filterStats[c])) return

        const results = []

        columns.forEach(c => {
            const idx = DM.columns.indexOf(c)
            const type = DM.types[idx]
            const scale = DM.scales[c]

            switch(type) {
                case DATA_TYPES.BOOLEAN:
                    const list = []
                    DM.filterStats[c].bins.map(value => {
                        const y = value === true ? DM.filterStats[c].countRel : 1 - DM.filterStats[c].countRel
                        list.push({ x: value, y: y, color: scale(value) })
                    })
                    results.push({ columnName: c, values: list, domain: [0, 1] })
                    break;
                case DATA_TYPES.NOMINAL:
                case DATA_TYPES.ORDINAL: {
                    const list = []
                    DM.filterStats[c].bins.map(name => {
                        list.push({ x: name, y: DM.filterStats[c].count[name], color: scale(name) })
                    })
                    list.sort((a, b) => a.x - b.x)
                    results.push({ columnName: c, values: list, domain: [0, max(list, d => d.y)] })
                } break
                default:
                case DATA_TYPES.SEQUENTIAL: {
                    const list = []
                    DM.filterStats[c].bins.forEach((b, i) => {
                        list.push({ x: b, y: DM.filterStats[c].count[i], color: scale(b) })
                    })
                    results.push({ columnName: c, values: list, domain: [0, max(list, d => d.y)] })
                }

            }
        })

        derived.value = results
    }

    onMounted(init)

    watch(props, init, { deep: true })
</script>