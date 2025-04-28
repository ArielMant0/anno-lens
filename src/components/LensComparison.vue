<template>
    <div class="d-flex justify-start align-start" style="max-height: 85vh; overflow-y: auto;">

        <div :style="{ minWidth: (chartWidth+5)+'px' }">
            <div style="text-align: center;" class="mb-1 text-dots" :style="{ maxWidth: chartWidth+'px' }">
                <v-icon :color="colorP" class="mr-1" size="small">mdi-circle-outline</v-icon>
                <span :style="{ fontWeight: activeLens === 0 ? 'bold' : null }">primary</span>
            </div>
            <div v-for="(c, i) in colsP"
                class="text-caption"
                :key="'p_'+c+'_'+i"
                :style="{
                    textAlign: 'center',
                    border: '1px solid ' + (c === selectedColumn ? 'black' : 'white'),
                    borderRadius: '4px'
                }">
                <div>
                    <div @click="setColor(0, i)" :style="{ maxWidth: (chartWidth-5)+'px' }" class="cursor-pointer text-dots hover-bold">
                        {{ i+1 }}. {{ c }}
                    </div>
                    <BarChart
                        :data="getMerged(0, c)"
                        :y-domain="[0, 1]"
                        color-attr="color"
                        selectable
                        @click="v => annotate(0, i, v.x)"
                        :width="chartWidth"
                        :height="chartHeight"/>
                </div>
            </div>
        </div>

        <div>
            <div style="min-height: 24px; text-align: center;"  class="mb-1"></div>
            <svg ref="conns" :width="Math.floor(chartWidth*0.5)" :height="height*numCols"></svg>
        </div>

        <div :style="{ minWidth: (chartWidth+5)+'px' }">
            <div style="text-align: center;" class="mb-1 text-dots" :style="{ maxWidth: chartWidth+'px' }">
                <v-icon :color="colorS" class="mr-1" size="small">mdi-circle-outline</v-icon>
                <span :style="{ fontWeight: activeLens === 1 ? 'bold' : null }">secondary</span>
            </div>
            <div v-for="(c, i) in colsS"
                class="text-caption"
                :key="'s_'+c+'_'+i"
                :style="{
                    textAlign: 'center',
                    border: '1px solid ' + (c === selectedColumn ? 'black' : 'white'),
                    borderRadius: '4px'
                }">
                <div>
                    <div @click="setColor(1, i)" :style="{ maxWidth: (chartWidth-5)+'px' }" class="cursor-pointer text-dots hover-bold">
                        {{ i+1 }}. {{ c }}
                    </div>
                    <BarChart
                        :data="getMerged(1, c)"
                        :y-domain="[0, 1]"
                        color-attr="color"
                        selectable
                        @click="v => annotate(0, i, v.x)"
                        :width="chartWidth"
                        :height="chartHeight"/>
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
    import { storeToRefs } from 'pinia';

    const app = useApp()
    const { activeLens } = storeToRefs(app)

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

    const emit = defineEmits(["update"])

    const conns = ref(null)

    const colsP = ref([])
    const colsS = ref([])

    const colorP = ref("")
    const colorS = ref("")

    const histG = new Map()

    const numCols = ref(1)
    const connSet = reactive(new Set())

    const height = computed(() => props.chartHeight + 20 + 8)

    let links = []

    function setColor(lensIndex, columnIndex) {
        app.setColorIndex(lensIndex, columnIndex)
        emit("update")
    }

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
            .attr("stroke-width", 4)
            .style("cursor", "pointer")
            .on("pointerenter", function() {
                d3.select(this).attr("opacity", 0.75)
            })
            .on("pointerleave", function() {
                d3.select(this).attr("opacity", 0.25)
            })
            .on("click", function(_event, d) {
                app.setColorIndex(0, d[0])
                app.setColorIndex(1, d[1])
                emit("update")
            })
            .append("title")
            .text(d => `${colsP.value[d[0]]}: (${d[0]+1}) - (${d[1]+1})`)
    }

    function getMerged(index, column) {
        const lens = DM.getLens(index)
        const other = lens.hists[column] ? lens.hists[column] : []
        const data = histG.get(column).concat(other)
        data.sort((a, b) => {
            if (a.x !== b.x) {
                return a.x - b.x
            }
            return b.y - a.y
        })
        return data
    }

    function read() {
        const limit = props.active ? undefined : 5
        const p = DM.getLens(0)
        const s = DM.getLens(1)
        colorP.value = p.color ? p.color : "black"
        colorS.value = s.color ? s.color : "black"
        // get column names (in order, for each lens)
        const pc = p.results[props.mode].map(d => d.name).slice(0, limit)
        const sc = s.results[props.mode].map(d => d.name).slice(0, limit)
        // store connected columns
        links = []
        connSet.clear()
        pc.forEach((c, i) => {
            let j = sc.indexOf(c)
            if (j >= 0) {
                connSet.add(c)
                links.push([i, j, Math.abs(pc[i].value-sc[j].value)])
            }
        })
        numCols.value = Math.max(1, Math.max(pc.length, sc.length))
        colsP.value = pc
        colsS.value = sc

        if (props.active) {
            drawConnections()
        } else {
            d3.select(conns.value).selectAll("*").remove()
        }

    }

    function readGlobal() {
        const data = DM.getData()
        DM.columns.forEach((c, i) => {
            const h = calcHistogram(data, c, DM.types[i], DM.filterStats, DM.scales[c])
            h.forEach(d => {
                const hsl = d3.hsl(d.color)
                d.color = hsl < 0.33 ? hsl.brighter(1.5) : hsl.darker(1.5)
            })
            histG.set(c, h)
        })
    }

    onMounted(function() {
        readGlobal()
        read()
    })

    watch(() => app.dataset, readGlobal)

    watch(() => props.active, read)
    watch(() => props.time, read)
</script>