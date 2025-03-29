<template>
    <v-card :title="props.title" density="compact" :style="{ border: '2px solid ' + (selected ? 'black' : 'white')}">
        <div v-if="disabled || !columnName" :style="{ width: width+'px', height: (height+27)+'px' }" class="d-flex align-center justify-center">
            <v-icon size="50">mdi-cancel</v-icon>
        </div>
        <div v-else>
            <div style="text-align: center; vertical-align: middle;" :style="{ maxWidth: width+'px' }" class="text-caption text-dots">
                <span style="font-size: 9px;">({{ columnValue.toFixed(2) }})</span> {{ columnName }}
            </div>
            <BarChart
                :data="derived"
                x-attr="x"
                y-attr="y"
                color-attr="color"
                :width="width"
                :height="height" />
        </div>
    </v-card>
</template>

<script setup>
    import * as d3 from 'd3'
    import { onMounted, watch } from 'vue';
    import BarChart from './vis/BarChart.vue';
    import { DATA_TYPES } from '@/stores/app';
    import DM from '@/use/data-manager';
    // import KDEChart from './vis/KDEChart.vue';
    import { getAttr } from '@/use/util';

    const props = defineProps({
        lens: {
            type: Number,
            required: true
        },
        index: {
            type: Number,
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
        title: {
            type: String,
            required: false
        },
        width: {
            type: Number,
            default: 200
        },
        height: {
            type: Number,
            default: 100
        },
        selected: {
            type: Boolean,
            default: false
        },
        disabled: {
            type: Boolean,
            default: false
        }
    })

    const derived = ref([])
    const columnName = ref("")
    const columnType = ref(-1)
    const columnValue = ref(0)

    function init() {
        const data = DM.getLensData(props.lens)
        if (!data || data.length === 0 || props.index >= DM.lensResults[props.lens][props.mode].length) {
            columnName.value = ""
            columnType.value = -1
            columnValue.value = 0
            derived.value = []
            return
        }

        const type = DM.lensResults[props.lens][props.mode][props.index].type

        if (!DM.lensResults[props.lens][props.mode][props.index] || type === null || type === undefined) {
            columnName.value = ""
            columnType.value = -1
            columnValue.value = 0
            derived.value = []
            return
        }

        const column = DM.lensResults[props.lens][props.mode][props.index].name
        const scale = DM.scales[column]
        columnName.value = column
        columnType.value = type
        columnValue.value = DM.lensResults[props.lens][props.mode][props.index].value

        switch(type) {
            case DATA_TYPES.BOOLEAN:
            case DATA_TYPES.ORDINAL: {
                const tmp = d3.group(data, d => getAttr(d, column))
                const list = []
                DM.filterStats[column].bins.map(c => {
                    const values = tmp.get(c)
                    list.push({ x: c, y: values ? values.length : 0, color: scale(c) })
                })
                derived.value = list
            } break
            // case DATA_TYPES.SET: {
            //     const vals = makeRelativeCounts(dataToNumbers(data, column, type), column)
            //     const tmp = d3.bin()
            //         .thresholds(5)
            //         .domain([DM.filterStats[column].min, DM.filterStats[column].max])
            //         (vals)

            //     const list = []
            //     tmp.forEach(d => list.push({ x: d.x0, y: d.length, color: scale(d.x0) }))
            //     derived.value = list
            // }
            default:
            case DATA_TYPES.SEQUENTIAL: {
                const tmp = d3.bin()
                    .thresholds(5)
                    .domain([DM.filterStats[column].min, DM.filterStats[column].max])
                    .value(d => getAttr(d, column))
                    (data)

                const list = []
                tmp.forEach(d => list.push({ x: d.x0, y: d.length, color: scale(d.x0) }))
                derived.value = list
            }

        }
    }

    onMounted(init)

    watch(props, init, { deep: true })
</script>