<template>
    <div class="d-flex justify-center align-start" style="max-height: 90vh; overflow-y: auto;">

        <div :style="{ minWidth: (chartWidth+25)+'px' }">
            <div>global</div>
            <div v-for="(c, i) in colsG"
                class="text-caption"
                :style="{
                    textAlign: 'center',
                    opacity: connSet.size === 0 || connSet.has(c) ? 1 : 0.5,
                    border: '1px solid ' + (c === selectedColumn ? 'black' : 'white'),
                    borderRadius: '4px'
                }">
                <div :style="{ maxWidth: chartWidth+'px' }" class="text-dots">{{ c }}</div>
                <BarChart
                    :data="histG[i]"
                    :y-domain="[0, 1]"
                    color-attr="color"
                    :width="chartWidth"
                    :height="chartHeight"/>
            </div>
        </div>

        <v-divider vertical class="ml-2 mr-2"></v-divider>

        <div :style="{ minWidth: (chartWidth+25)+'px' }">
            <div>primary lens</div>
            <div v-for="(c, i) in colsP"
                class="text-caption"
                :style="{
                    textAlign: 'center',
                    opacity: connSet.has(c) ? 1 : 0.5,
                    border: '1px solid ' + (c === selectedColumn ? 'black' : 'white'),
                    borderRadius: '4px'
                }">
                <div class="d-flex align-center">
                    <v-btn icon="mdi-tag" size="sm" density="compact" variant="plain" @click="annotate(0, i)" class="ml-1 mr-1"/>
                    <div>
                        <div :style="{ maxWidth: chartWidth+'px' }" class="text-dots">{{ c }}</div>
                        <BarChart
                            :data="DM.getLens(0).hists[c]"
                            :y-domain="[0, 1]"
                            color-attr="color"
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

        <div :style="{ minWidth: (chartWidth+25)+'px' }">
            <div>secondary lens</div>
            <div v-for="(c, i) in colsS"
                class="text-caption"
                :style="{
                    textAlign: 'center',
                    opacity: connSet.has(c) ? 1 : 0.5,
                    border: '1px solid ' + (c === selectedColumn ? 'black' : 'white'),
                    borderRadius: '4px'
                }">
                <div class="d-flex align-center">
                    <div>
                        <div :style="{ maxWidth: chartWidth+'px' }" class="text-dots">{{ c }}</div>
                        <BarChart
                            :data="DM.getLens(1).hists[c]"
                            :y-domain="[0, 1]"
                            color-attr="color"
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

    const app = useApp()

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

    const colsG = ref([])
    const histG = ref([])

    const numCols = ref(1)
    const connSet = reactive(new Set())

    const height = computed(() => props.chartHeight + 20 + 8)

    let links = []

    function annotate(lensIndex, columnIndex) {
        const lens = DM.getLens(lensIndex)
        DM.annotate(
            lensIndex,
            lens.radius,
            columnIndex,
            props.mode,
            lens.type
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
        const results = [], cols = []
        DM.columns.forEach((c, i) => {
            cols.push(c)
            results.push(calcHistogram(data, c, DM.types[i], DM.filterStats, DM.scales[c]))
        })
        histG.value = results
        colsG.value = cols
    }

    onMounted(function() {
        readGlobal()
        read()
    })

    watch(() => app.dataset, readGlobal)

    watch(() => ([props.active, props.time, props.selectedColumn]), read, { deep: true })
</script>