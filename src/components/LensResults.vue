<template>
    <v-card :title="props.title" density="compact" :style="{ border: '2px solid ' + (selected ? 'black' : 'white')}">
        <div v-if="disabled || !columnName" :style="{ width: width+'px', height: height+'px' }" class="d-flex align-center justify-center">
            <v-icon size="50">mdi-cancel</v-icon>
        </div>
        <div v-else>
            <div style="text-align: center;" :style="{ maxWidth: width+'px' }" class="text-caption text-dots">{{ columnName }}</div>
            <BarChart
                :data="derived"
                x-attr="x"
                y-attr="y"
                color-attr="color"
                :width="width"
                :height="height" />
<!--
            <KDEChart v-if="columnType === DATA_TYPES.SEQUENTIAL"
                :data="raw"
                :binned="derived"
                x-attr="x"
                y-attr="y"
                color-attr="color"
                :width="width"
                :height="height" /> -->
        </div>
    </v-card>
</template>

<script setup>
    import * as d3 from 'd3'
    import { onMounted, watch } from 'vue';
    import BarChart from './vis/BarChart.vue';
    import { DATA_TYPES } from '@/stores/app';
    import DM from '@/use/data-manager';
    import KDEChart from './vis/KDEChart.vue';

    const props = defineProps({
        lens: {
            type: Number,
            required: true
        },
        index: {
            type: Number,
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

    const raw = ref([])
    const derived = ref([])
    const columnName = ref("")
    const columnType = ref(-1)

    function init() {
        const data = DM.getLensData(props.lens)
        if (!data || data.length === 0) {
            columnName.value = ""
            columnType.value = -1
            derived.value = []
            return
        }

        const type = DM.lensTypes[props.lens][props.index]

        if (!DM.lensColumns[props.lens][props.index] || type === null || type === undefined) {
            columnName.value = ""
            columnType.value = -1
            derived.value = []
            return
        }

        const column = DM.lensColumns[props.lens][props.index].name
        const scale = DM.scales[column]
        columnName.value = column
        columnType.value = type

        switch(type) {
            case DATA_TYPES.ORDINAL: {
                const tmp = d3.group(data, d => d[column])
                const list = []
                DM.filterStats[column].bins.map(c => {
                    const values = tmp.get(c)
                    list.push({ x: c, y: values ? values.length : 0, color: scale(c) })
                })
                derived.value = list
            } break
            default:
            case DATA_TYPES.SEQUENTIAL: {
                const tmp = d3.bin()
                    .thresholds(5)
                    .domain([DM.filterStats[column].min, DM.filterStats[column].max])
                    .value(d => d[column])
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