<template>
    <v-card :title="props.title" density="compact" :style="{ border: '2px solid ' + (selected ? 'black' : 'white')}">
        <div style="text-align: center;">{{ columnName }}</div>
        <BarChart :data="derived"
            x-attr="x"
            y-attr="y"
            color-attr="color"
            :width="width"
            :height="height" />
    </v-card>
</template>

<script setup>
    import * as d3 from 'd3'
    import { onMounted, watch } from 'vue';
    import BarChart from './vis/BarChart.vue';
    import { DATA_TYPES } from '@/stores/app';
    import DM from '@/use/data-manager';

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
        }
    })

    const derived = ref([])
    const columnName = ref("")

    function init() {
        const data = DM.getLensData(props.lens)
        if (!data) {
            columnName.value = ""
            return
        }

        const column = DM.lensColumns[props.lens][props.index].name
        const type = DM.lensTypes[props.lens][props.index]
        const scale = DM.scales[column]
        columnName.value = column

        switch(type) {
            case DATA_TYPES.ORDINAL: {
                const tmp = d3.group(data, d => d[column])
                const list = []
                tmp.forEach((values, name) => list.push({ x: name, y: values.length, color: scale(name) }))
                derived.value = list
            } break
            default:
            case DATA_TYPES.SEQUENTIAL: {
                const tmp = d3.bin()
                    .thresholds(5)
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