<template>
    <div style="min-height: 80vh;" class="d-flex flex-column align-center justify-start">
        <div v-if="data.length > 0" class="mt-2">
            <div style="text-align: center;">
                <div>
                    <div class="d-flex align-end">
                        <div class="d-flex flex-column mr-2">
                            <v-btn v-for="(t, i) in LENS_TYPES" :key="'l_'+t"
                                density="comfortable"
                                class="mb-1"
                                :color="lensType === t ? 'primary' : 'default'"
                                @click="setLensType(t)">
                                {{ Lens.getLensName(t) }} ({{ KEYS[i] }})
                            </v-btn>
                        </div>

                        <BarChart :data="historyData"
                            :width="w-150"
                            @click="d => toggleShowAttr(d.x)"
                            :selected="int.showAttrMap ? [int.showAttrMap] : []"
                            selectable/>

                        <div class="d-flex flex-wrap align-center ml-2" style="max-width: 600px">
                            <v-chip v-for="c in columns"
                                class="text-caption mr-1 mb-1"
                                :color="colorOverride === c ? 'primary' : 'default'"
                                @click="toggleColorOverride(c)"
                                density="compact">
                                {{ c.replaceAll('_', ' ') }}
                            </v-chip>
                        </div>
                    </div>

                </div>

                <div class="d-flex mt-2">
                    <div v-if="int.showAttrMap" class="mr-2">
                        <div :style="{ width: w+'px' }">Attribute Map: {{ int.showAttrMap }}, Color: {{ chosenColorAttr }}</div>
                        <div style="position: relative;">
                            <svg ref="over" :width="w" :height="h"></svg>
                            <ScatterPlot
                                style="position: absolute; top: 0; left: 0;"
                                :data="data"
                                :update="showTime"
                                :x-attr="datasetX"
                                :y-attr="datasetY"
                                :color-attr="chosenColorAttr"
                                :opacity-attr="'visited.'+int.showAttrMap"
                                :color-scale="int.scales[chosenColorAttr]"
                                :radius="3"
                                :search-radius="6"
                                :width="w"
                                :height="h"/>

                        </div>
                    </div>

                    <div v-else class="mr-2">
                        <div :style="{ width: w+'px' }">Color: {{ chosenColorAttr }} <span v-if="!int.fromLens">(default)</span></div>
                        <ScatterPlot
                            :data="data"
                            :time="dataTime"
                            :update="lensTime"
                            :x-attr="datasetX"
                            :y-attr="datasetY"
                            :color-attr="chosenColorAttr"
                            :color-scale="int.scales[chosenColorAttr]"
                            :radius="3"
                            :search-radius="lensRadius"
                            :width="w"
                            :height="h"
                            show-lens
                            :num-lens="numLens"
                            :active-lens="activeLens"
                            :fixed-lens="!moveLens"
                            @hover="onHover"
                            @click="onClick"/>

                    </div>

                    <div style="margin-top: 25px;">
                        <ColorLegend :scale="int.scales[chosenColorAttr]" :height="h"></ColorLegend>
                    </div>

                    <div style="margin-top: 25px;" :style="{ opacity: int.showAttrMap ? 0.25 : 1 }">
                        <div v-for="i in numLens" :key="'det_'+i" class="mb-2 d-flex align-center">
                            <div v-for="j in i+1" :key="'v_'+i+'_'+j">
                                <div style="font-size: 10px;">Reference: {{ getLensResultLabel(j-1) }}</div>
                                <LensResults
                                    class="mr-1"
                                    :selected="i === activeLens+1 && colorIndex === j-1"
                                    :disabled="int.lenses[i-1].numResults < i-1"
                                    :lens="i-1"
                                    :index="j-1"
                                    :time="lensTime"
                                    :width="150"
                                    :height="75"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-8" style="width: 100%;">
                <h4>Snapshots</h4>
                <div v-for="(s, i) in snapshots" :key="'snap_'+i" class="d-flex align-center">
                    <div class="ml-2 mr-2 text-caption" style="width: 300px;">
                        <div><b>Dataset:</b> {{ s.dataset }}</div>
                        <div><b>Lens:</b> {{ Lens.getLensName(s.lens) }}</div>
                        <div><b>Reference:</b> {{ getLensResultLabel(s.reference) }}</div>
                    </div>
                    <BarChart :data="s.data" :width="w"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import * as d3 from 'd3'
    import ScatterPlot from './ScatterPlot.vue'
    import { storeToRefs } from 'pinia'
    import { DATA_TYPES, useApp } from '@/stores/app';
    import { Lens, LENS_TYPE, LENS_TYPES } from '@/use/Lens';
    import { computed, reactive } from 'vue';
    import LensResults from './LensResults.vue';
    import BarChart from './vis/BarChart.vue';
    import DM from '@/use/data-manager';
import ColorLegend from './vis/ColorLegend.vue';

    const app = useApp()

    const { datasetX, datasetY, datasetColor } = storeToRefs(app)

    const props = defineProps({
        dataset: {
            type: String,
            default: "iris"
        }
    })

    const over = ref(null)

    const w = ref(800)
    const h = ref(500)

    const data = ref([])
    const dataTime = ref(0)
    const columns = ref([])
    const ctypes = ref([])

    const showTime = ref(0)
    const int = reactive({
        scales: {},
        lenses: [],
        columns: [],
        types: [],
        fromLens: false,

        showAttrMap: null,
        attrLensPos: {},
        historyScales: {}
    })

    const history = reactive(new Map())
    const historyData = computed(() => {
        const list = []
        history.forEach((v, k) => list.push({ x: k, y: v }))
        return list
    })
    const snapshots = ref([])

    const colorIndex = ref(0)
    const colorColumn = ref(datasetColor.value)
    const colorOverride = ref("")

    const chosenColorAttr = computed(() => {
        if (colorOverride.value.length > 0) {
            return colorOverride.value
        }
        return int.showAttrMap ? int.showAttrMap : colorColumn.value
    })

    const moveLens = ref(true)

    const lensTime = ref(0)
    const lensType = ref(LENS_TYPE.RARE)
    const numLens = ref(2)
    const activeLens = ref(numLens.value-1)
    const lensRadius = ref(20)

    const KEYS = ["Q", "W", "E"]

    let lensX = null;
    let lensY = null;

    function getDataType(d) {
        switch (typeof d) {
            default:
            case 'number':
                return DATA_TYPES.SEQUENTIAL
            case 'string':
                return DATA_TYPES.ORDINAL
        }
    }
    function getLensResultLabel(jindex) {
        if (jindex === 0) {
            return "Local"
        } else if (jindex === 1) {
            return "Global"
        } else {
            return `Lens ${jindex-1}`
        }
    }
    function toggleColorOverride(name) {
        colorOverride.value = colorOverride.value !== name ? name : ""
        lensTime.value = Date.now()
    }

    function saveHistory() {
        snapshots.value.push({
            time: Date.now(),
            dataset: app.dataset,
            lens: lensType.value,
            reference: colorIndex.value,
            positions: int.attrLensPos,
            data: historyData.value,
        })
        history.clear()
        int.attrLensPos = {}
        columns.value.forEach(c => int.attrLensPos[c] = [])
        data.value.forEach(d => columns.value.forEach(c => d.visited[c] = 0))
        lensTime.value = Date.now()
    }
    function setLensType(t) {
        saveHistory()
        lensType.value = t;
        int.lenses.forEach(l => l.type = t)
        applyLens()
    }
    function setColorIndex(i) {
        const idx = Math.min(i, activeLens.value+1)
        if (idx !== colorIndex.value) {
            saveHistory()
        }
        colorIndex.value = idx
        colorColumn.value = DM.lensColumns[activeLens.value][colorIndex.value].name
    }
    function toggleShowAttr(name) {
        int.showAttrMap = int.showAttrMap === name ? null : name
        showTime.value = Date.now()
        setTimeout(drawPositions, 100)
    }
    function drawPositions() {
        const svg = d3.select(over.value)
        const data = int.showAttrMap && int.attrLensPos[int.showAttrMap] ?
            int.attrLensPos[int.showAttrMap] :
            []

        svg.selectAll(".lens")
            .data(data)
            .join("circle")
            .classed("lens", true)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 10)
            .attr("fill-opacity", 0.01)
            .attr("fill", "grey")
            .attr("stroke-opacity", 0.1)
            .attr("stroke", "grey")
            .transition()
            .duration(500)
            .attr("r", d => d.radius)
    }

    function applyLens() {
        const lensData = DM.lensData
        if (lensData.length === 0) return

        let cols = [], types = []
        if (lensData.some(d => d.length > 0)) {
            let prev = null
            int.fromLens = lensData[activeLens.value].length > 0
            cols = int.lenses.map((d, i) => {
                if (lensData[i].length > 0) {
                    const res = d.apply(lensData[i], columns.value, ctypes.value, prev ? [prev] : [])
                    prev = res
                    return res
                } else {
                    prev = null
                    return []
                }
            })

            const now = Date.now()
            cols.forEach((c, i) => {
                if (c.length > 0) {
                    if (i === activeLens.value) {
                        const j = colorIndex.value
                        const n = c[j].name
                        const val = (history.get(n) || 0) + 1
                        history.set(n, val)
                        int.historyScales[n].domain([0, Math.max(val, int.historyScales[n].domain()[1])])

                        if (lensX !== null && lensY !== null) {
                            int.attrLensPos[n].push({
                                x: lensX,
                                y: lensY,
                                time: now,
                                radius: int.lenses[activeLens.value].radius
                            })

                            if (colorIndex.value > 1) {
                                    int.attrLensPos[n].push({
                                    x: lensX,
                                    y: lensY,
                                    time: now,
                                    radius: int.lenses[colorIndex.value-2].radius
                                })
                            }
                        }
                    }
                    types.push(c.map(d => getDataType(data.value[0][d.name])))
                } else {
                    types.push(null)
                }
            })
        } else {
            int.fromLens = false
        }
        colorColumn.value = int.fromLens ? cols[activeLens.value][colorIndex.value].name : datasetColor.value
        DM.setLensColumns(cols)
        DM.setLensTypes(types)
        lensTime.value = Date.now()
    }

    function onHover(points, lx, ly) {
        DM.setLensData(points.map(list => {
            const ids = new Set(list)
            return data.value.filter(d => {
                if (ids.has(d.id)) {
                    d.visited[colorColumn.value]++
                }
                return ids.has(d.id)
            })
        }))
        lensX = lx;
        lensY = ly;
        applyLens()
    }
    function onClick(_, lx, ly) {
        moveLens.value = !moveLens.value;
        lensX = lx;
        lensY = ly;
    }

    function makeScale(data, column, type) {
        switch(type) {
            case DATA_TYPES.SEQUENTIAL:
                return d3.scaleSequential(d3.interpolateTurbo)
                    .unknown("grey")
                    .domain(d3.extent(data, d => d[column]))
            default:
            case DATA_TYPES.ORDINAL:
                const tmp = d3.group(data, d => d[column])
                const dom = Array.from(tmp.keys())
                dom.sort()
                return d3.scaleOrdinal(d3.schemeCategory10).domain(dom).unknown("black")
        }
    }

    async function init() {
        data.value = []
        int.scales = {}
        int.lenses = []
        int.fromLens = false
        int.showAttrMap = null
        int.attrLensPos = {}
        int.historyScales = {}
        history.clear()
        colorIndex.value = 0
        colorColumn.value = app.datasetColor

        lensX = null;
        lensY = null;

        DM.setData()
        DM.setLensData()

        const points = await d3.csv(`data/${props.dataset}.csv`, d3.autoType)
        columns.value = points.columns.filter(d => {
            const n = d.toLowerCase()
            return n !== "id" && n !== "x" && n !== "y" && !app.datasetObj.ignore.includes(n)
        })
        // set id if not part of dataset
        if (!points[0]["id"]) {
            points.forEach((d, i) => d.id = i)
        }

        for (let i = 1; i <= numLens.value; ++i) {
            int.lenses.push(new Lens(lensRadius.value*i, lensType.value))
        }

        const ct = [], scales = {}
        columns.value.forEach(c => {
            ct.push(getDataType(points[0][c]))
            scales[c] = makeScale(points, c, ct.at(-1))
            int.historyScales[c] = d3.scaleSequential(d3.interpolateOrRd).domain([0, 1])
            int.attrLensPos[c] = []
        })
        DM.setLensColumns(columns.value.map(d => ({ name: d, value: 0 })))
        DM.setLensTypes(ct)
        DM.setScales(scales)

        int.scales = scales
        ctypes.value = ct

        points.forEach(d => {
            d.visited = {}
            columns.value.forEach(c => d.visited[c] = 0)
        })

        DM.setData(points, columns.value, ct)
        data.value = points
        dataTime.value = Date.now()
    }

    onMounted(function() {
        window.addEventListener("wheel", function(event) {
            const [mx, my] = d3.pointer(event, document.body)
            const elem = document.elementFromPoint(mx, my)
            if (!elem || !elem.classList.contains("scatter")) return
            event.preventDefault()
            lensRadius.value = Math.max(
                5,
                Math.min(
                    Math.max(w.value, h.value),
                    Math.round(lensRadius.value + event.deltaY * -0.05)
                )
            )
            int.lenses.forEach((l, i) => l.radius = lensRadius.value * (i+1))
        })
        window.addEventListener("keyup", function(event) {
            switch(event.code) {
                case "Digit1":
                case "Digit2":
                case "Digit3":
                case "Digit4":
                case "Digit5":
                    const num = Number.parseInt(event.code.at(-1)) - 1
                    if (event.shiftKey) {
                        if (num < numLens.value && num !== activeLens.value) {
                            activeLens.value = num
                            setColorIndex(colorIndex.value)
                        }
                    } else if (num !== colorIndex.value && num < activeLens.value + 2){
                        setColorIndex(num)
                    }
                    break
                default:
                    const i = KEYS.findIndex(d => "Key"+d === event.code)
                    if (i >= 0 && lensType.value !== LENS_TYPES[i])  {
                        setLensType(LENS_TYPES[i])
                    }
                    break;
            }
            applyLens()
        })
        init()
    })

    watch(props, init, { deep: true })
</script>