<template>
    <div class="d-flex justify-center align-start" style="max-height: 90vh; overflow-y: auto;">

        <div :style="{ minWidth: (chartWidth+50)+'px' }">
            <div>primary lens</div>
            <div v-for="(c, i) in colsP"
                class="text-caption"
                :style="{
                    textAlign: 'center',
                    border: '1px solid ' + (c === selectedColumn ? 'black' : 'white'),
                    borderRadius: '4px'
                }">
                <div class="d-flex align-center">
                    <v-btn icon="mdi-tag" size="sm" density="compact" variant="plain" @click="annotate(0, i)" class="ml-1 mr-1"/>
                    <div>
                        <div :style="{ maxWidth: chartWidth+'px' }" class="text-dots">{{ c }}</div>
                        <BarChart
                            :data="getMerged(0, c)"
                            :y-domain="[0, 1]"
                            pattern-attr="pattern"
                            color-attr="color"
                            selectable
                            @click="v => annotate(0, i, v.x)"
                            :width="chartWidth"
                            :height="chartHeight"/>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <div style="min-height: 24px;">
                <v-btn
                    variant="tonal"
                    rounded="sm"
                    @click="DM.swapLenses(0, 1)"
                    icon="mdi-swap-horizontal"
                    density="compact"/>
            </div>
            <svg ref="conns" :width="Math.floor(chartWidth*0.5)" :height="height*numCols"></svg>
        </div>

        <div :style="{ minWidth: (chartWidth+50)+'px' }">
            <div>secondary lens</div>
            <div v-for="(c, i) in colsS"
                class="text-caption"
                :style="{
                    textAlign: 'center',
                    border: '1px solid ' + (c === selectedColumn ? 'black' : 'white'),
                    borderRadius: '4px'
                }">
                <div class="d-flex align-center">
                    <div>
                        <div :style="{ maxWidth: chartWidth+'px' }" class="text-dots">{{ c }}</div>
                        <BarChart
                            :data="getMerged(1, c)"
                            :y-domain="[0, 1]"
                            pattern-attr="pattern"
                            color-attr="color"
                            selectable
                            @click="v => annotate(0, i, v.x)"
                            :width="chartWidth"
                            :height="chartHeight"/>
                    </div>

                    <v-btn icon="mdi-tag" size="sm" density="compact" variant="plain" @click="annotate(1, i)" class="ml-1 mr-1"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import * as d3 from 'd3'
    import DM from '@/use/data-manager';
    import { computed, onMounted, reactive, ref, watch } from 'vue';
    import BarChart from './vis/BarChart.vue';
    import { useApp } from '@/stores/app';
    import { calcHistogram } from '@/use/util';
    import { useControls } from '@/stores/controls';

    const app = useApp()
    const controls = useControls()

    const props = defineProps({
        active: {
            type: Boolean,
            default: true
        },
        selectedColumn: {
            type: String,
            required: true
        },
        mode: {
            type: String,
            required: true
        },
        chartWidth: {
            type: Number,
            default: 150
        },
        chartHeight: {
            type: Number,
            default: 60
        },
        time: {
            type: Number,
            default: 0
        },
    })

    const conns = ref(null)

    const colsP = ref([])
    const colsS = ref([])

    const histG = new Map()

    const numCols = ref(1)
    const connSet = reactive(new Set())

    const height = computed(() => props.chartHeight + 20 + 8)

    let links = []

    function annotate(lensIndex, columnIndex, columnValue=null) {
        const lens = DM.getLens(lensIndex)
        DM.annotate(
            lensIndex,
            columnIndex,
            props.mode,
            lens.type,
            controls.getColor(0),
            columnValue
        )
    }

    function drawConnections() {
        const svg = d3.select(conns.value)
        svg.selectAll("*").remove()

        // const ws = d3.scaleQuantile(links.map(d => d[2])).range([6, 4, 2, 1])

        const path = d3.line()
            .curve(d3.curveBumpX)
            .x(d => d[0])
            .y(d => d[1])

        svg.selectAll("path")
            .data(links)
            .join("path")
            .attr("d", d => path([[2, d[0] * height.value + 15], [Math.floor(props.chartWidth*0.5) - 2, d[1] * height.value + 15]]))
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("opacity", 0.25)
            .attr("stroke-width", 2)
    }

    function getMerged(index, column) {
        const data = histG.get(column).concat(DM.getLens(index).hists[column])
        data.sort((a, b) => b.y - a.y)
        return data
    }

    function read() {
        if (props.active) {
            const p = DM.getLens(0)
            const s = DM.getLens(1)
            // get column names (in order, for each lens)
            const pc = p.results[props.mode].map(d => d.name)
            const sc = s.results[props.mode].map(d => d.name)
            // store connected columns
            links = []
            connSet.clear()
            pc.forEach((c, i) => {
                let j = sc.indexOf(c)
                if (j >= 0) {
                    connSet.add(c)
                    links.push([i, j, Math.abs(p.results[props.mode][i].value-s.results[props.mode][j].value)])
                }
            })
            numCols.value = Math.max(1, Math.max(pc.length, sc.length))
            colsP.value = pc
            colsS.value = sc
        } else {
            links = []
            connSet.clear()
            colsP.value = []
            colsS.value = []
        }
        drawConnections()
    }

    function readGlobal() {
        const data = DM.getData()
        DM.columns.forEach((c, i) => {
            const h = calcHistogram(data, c, DM.types[i], DM.filterStats, DM.scales[c])
            h.forEach(d => d.pattern = true)
            histG.set(c, h)
        })
    }

    onMounted(function() {
        readGlobal()
        read()
    })

    watch(() => app.dataset, readGlobal)

    watch(() => ([props.active, props.time, props.selectedColumn]), read, { deep: true })
</script>