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
                                :variant="t === lensType ? 'flat' : 'outlined'"
                                :color="Lens.getLensColor(t)"
                                @click="setLensType(t)">
                                {{ Lens.getLensName(t) }} ({{ KEYS[i] }})
                            </v-btn>
                        </div>

                        <BarChart :data="historyData"
                            :width="w-150"
                            @click="d => toggleShowAttr(d.x)"
                            :selected="int.showAttrMap ? [int.showAttrMap] : []"
                            selectable/>

                        <div>
                            <v-text-field v-model="searchCol"
                                density="compact"
                                variant="outlined"
                                clearable
                                class="mb-1"
                                label="search for column"/>
                            <div class="d-flex flex-wrap align-center ml-2" style="max-width: 600px; max-height: 150px; overflow-y: auto;">
                                <v-chip v-for="c in columMatches"
                                    class="text-caption mr-1 mb-1"
                                    :color="colorOverride === c ? 'primary' : 'default'"
                                    @click="toggleColorOverride(c)"
                                    density="compact">
                                    {{ c.replaceAll('_', ' ') }}
                                </v-chip>
                            </div>
                        </div>
                    </div>

                </div>

                <div class="d-flex mt-2">
                    <div v-if="int.showAttrMap" class="mr-2">
                        <div :style="{ width: w+'px' }">Attribute Map: {{ int.showAttrMap }}, Color: <b>{{ chosenColorAttr }}</b></div>
                        <div style="position: relative;">
                            <svg ref="under" :width="w" :height="h"></svg>
                            <ScatterPlot
                                style="position: absolute; top: 0; left: 0;"
                                :data="data"
                                :selected="dataF"
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
                        <div :style="{ width: w+'px' }" class="d-flex justify-space-between">
                            <div>
                                Color: {{ chosenColorAttr }} <span v-if="!int.fromLens">(default)</span>
                            </div>
                            <FilterDesc v-if="int.filterAttr !== null"
                                :data="int.filterValues"
                                :name="int.filterAttr"
                                @clear="setFilter(null)"
                                :ordinal="int.filterType === DATA_TYPES.ORDINAL || int.filterType === DATA_TYPES.BOOLEAN"
                                :scale="int.scales[int.filterAttr]"/>
                        </div>

                        <div style="position: relative;">
                            <ScatterPlot
                                :data="data"
                                :selected="dataF"
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

                            <svg ref="over" :width="w" :height="h" style="position: absolute; top: 0; left: 0; pointer-events: none;"></svg>
                        </div>

                    </div>

                    <div style="margin-top: 25px;">
                        <ColorLegend :key="chosenColorAttr"
                            :scale="int.scales[chosenColorAttr]"
                            :selected="chosenColorAttr === int.filterAttr ? int.filterValues : []"
                            :height="h"
                            @click="setFilter"
                            @brush="setFilter"/>
                    </div>

                    <div style="margin-top: 25px;" :style="{ opacity: int.showAttrMap ? 0.25 : 1 }">
                        <div v-for="i in numLens" class="mb-8">
                            <div class="mb-1 text-caption d-flex align-center justify-center">
                                <span>Lens {{ i }}</span>
                                <v-icon v-if="i === 1">mdi-circle-small</v-icon>
                                <v-icon v-else-if="i === 2">mdi-circle-medium</v-icon>
                                <v-icon v-else>mdi-circle</v-icon>
                            </div>
                            <div v-for="mode in ['local', 'global']" class="d-flex align-center mb-1">
                                <div style="font-size: 12px; text-orientation: upright; writing-mode: vertical-lr;">{{ mode }}</div>
                                <LensResults v-for="k in numDetails" :key="'det_'+i+'_'+mode+'_'+k"
                                    class="mr-1"
                                    :selected="i === activeLens+1 && colorIndex === k-1 && refMode === mode"
                                    :disabled="int.lenses[i-1].numResults[refMode] < i"
                                    :lens="i-1"
                                    :index="k-1"
                                    :mode="mode"
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
                        <div><b>Reference:</b> {{ s.reference }}</div>
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
    import FilterDesc from './FilterDesc.vue';
    import { getAttr, getDataType, makeColorScale } from '@/use/util';

    const app = useApp()

    const { datasetX, datasetY, datasetColor } = storeToRefs(app)

    const props = defineProps({
        dataset: {
            type: String,
            default: "iris"
        }
    })

    const under = ref(null)
    const over = ref(null)

    const w = ref(800)
    const h = ref(500)

    const data = ref([])
    const dataF = computed(() => {
        if (int.filterAttr === null) return []
        if (int.filterType === DATA_TYPES.ORDINAL || int.filterType === DATA_TYPES.BOOLEAN) {
            const v = int.filterValues
            return data.value
                .filter(d => v.includes(getAttr(d, int.filterAttr)))
                .map(d => d.id)
        }
        const [a, b] = int.filterValues
        return data.value
            .filter(d => getAttr(d, int.filterAttr) >= a && getAttr(d, int.filterAttr) <= b)
            .map(d => d.id)
    })
    const searchCol = ref("")
    const dataTime = ref(0)
    const columns = ref([])
    const ctypes = ref([])

    const columMatches = computed(() => {
        if (!searchCol.value || searchCol.value.length === 0) {
            return columns.value
        }
        const regex = new RegExp(searchCol.value, "gi")
        return columns.value.filter(d => regex.test(d))
    })

    const showTime = ref(0)
    const int = reactive({
        scales: {},
        lenses: [],
        columns: [],
        types: [],
        fromLens: false,

        filterAttr: null,
        filterValues: null,
        filterType: null,

        showAttrMap: null,
        attrLensPos: {},
        historyScales: {}
    })

    let historyUpdated = false
    const history = reactive(new Map())
    const historyData = computed(() => {
        const list = []
        history.forEach((v, k) => list.push({ x: k, y: v }))
        return list
    })
    const snapshots = ref([])
    const annotations = ref([])

    const refMode = ref("local")
    const colorIndex = ref(0)
    const colorColumn = ref(datasetColor.value)
    const colorOverride = ref("")
    const colorType = computed(() => {
        const idx = columns.value.indexOf(chosenColorAttr.value)
        return idx >= 0 ? ctypes.value[idx] : null
    })

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
    const numDetails = ref(3)
    const activeLens = ref(numLens.value-1)
    const lensRadius = ref(20)

    const KEYS = ["Q", "W"]

    let lensX = null;
    let lensY = null;


    function toggleColorOverride(name) {
        colorOverride.value = colorOverride.value !== name ? name : ""
        lensTime.value = Date.now()
    }

    function saveHistory() {
        if (!historyUpdated) return
        snapshots.value.push({
            time: Date.now(),
            dataset: app.dataset,
            lens: lensType.value,
            index: colorIndex.value,
            mode: refMode.value,
            positions: int.attrLensPos,
            filter: {
                attr: int.filterAttr,
                type: int.filterType,
                values: int.filterValues,
            },
            data: historyData.value,
        })
        history.clear()
        historyUpdated = false
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
        const idx = Math.min(i, 5)
        colorIndex.value = idx
        colorColumn.value = DM.lensResults[activeLens.value][refMode.value][idx].name
    }
    function setRefMode(mode="local") {
        const m = mode === "local" || mode === "global" ? mode : "local"
        if (m !== refMode.value) {
            saveHistory()
            refMode.value = m
        }
    }
    function annotate() {
        annotations.value.push({
            x: lensX,
            y: lensY,
            mode: refMode.value,
            lensType: lensType.value,
            column: colorColumn.value,
        })
        drawAnnotations()
    }
    function drawAnnotations() {
        const svg = d3.select(over.value)
        svg.selectAll("*").remove()

        const g = svg.selectAll("g.anno")
            .data(annotations.value)
            .join("g")
            .classed("anno", true)
            .attr("font-size", 10)

        const getW = d => d.column.length * 5 + 10

        g.append("rect")
            .attr("x", d => d.x - getW(d) * 0.5)
            .attr("y", d => d.y - 7)
            .attr("width", d => getW(d))
            .attr("height", 20)
            .attr("fill", "grey")
            .attr("stroke", d => Lens.getLensColor(d.lensType))
            .attr("fill-opacity", 0.5)

        g.append("text")
            .attr("x", d => d.x)
            .attr("y", d => d.y + 6)
            .attr("text-anchor", "middle")
            .text(d => d.column)
    }
    function highlightAnnotations() {
        const svg = d3.select(over.value)

        const any = annotations.value.some(d => d.column === chosenColorAttr.value)

        svg.selectAll("g.anno rect")
            .attr("opacity", d => !any || d.column === chosenColorAttr.value ? 1 : 0.25)
    }

    function setFilter(values) {
        if (values !== null) {
            const attr = chosenColorAttr.value
            int.filterType = colorType.value
            switch(int.filterType) {
                case DATA_TYPES.BOOLEAN:
                case DATA_TYPES.ORDINAL:
                    if (int.filterAttr !== attr) {
                        int.filterAttr = attr
                        int.filterValues = [values]
                    } else  {
                        const idx = int.filterValues.indexOf(values)
                        if (idx >= 0) {
                            if (int.filterValues.length === 1) {
                                int.filterValues = null
                            } else {
                                int.filterValues.splice(idx, 1)
                            }
                        } else {
                            int.filterValues.push(values)
                        }
                        int.filterAttr = int.filterValues !== null ? attr : null
                    }
                    break;
                case DATA_TYPES.SEQUENTIAL:
                    if (int.filterAttr !== attr) {
                        int.filterAttr = attr
                        int.filterValues = values
                    } else  {
                        int.filterValues = int.filterValues[0] === values[0] && int.filterValues[1] === values[1] ? null : values
                        int.filterAttr = int.filterValues !== null ? attr : null
                    }
                    break;
            }
        } else {
            int.filterValues = null
            int.filterAttr = null
            int.filterType = null
        }

        DM.computeFilterStats(dataF.value)
        applyLens()
    }

    function toggleShowAttr(name) {
        int.showAttrMap = int.showAttrMap === name ? null : name
        showTime.value = Date.now()
        setTimeout(drawPositions, 100)
    }
    function drawPositions() {
        const svg = d3.select(under.value)
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
            .attr("stroke-opacity", 0.05)
            .attr("stroke", "grey")
            .transition()
            .duration(500)
            .attr("r", d => d.radius)
    }

    function applyLens() {
        const lensData = DM.lensData
        if (lensData.length === 0) return

        let results = []
        if (lensData.some(d => d.length > 0)) {
            // let prev = null
            int.fromLens = lensData[activeLens.value].length > 0
            results = int.lenses.map((d, i) => {
                if (lensData[i].length > 0) {
                    return d.apply(lensData[i], columns.value, ctypes.value)
                    // prev = res
                    // return res
                } else {
                    // prev = null
                    return []
                }
            })

            const now = Date.now()
            results.forEach((res, i) => {
                if (i === activeLens.value) {
                    const j = colorIndex.value
                    const mode = refMode.value
                    if (j < res[mode].length) {
                        const n = res[mode][j].name
                        const val = (history.get(n) || 0) + 1
                        history.set(n, val)
                        int.historyScales[n].domain([0, Math.max(val, int.historyScales[n].domain()[1])])
                        historyUpdated = true

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
                }
            })
        } else {
            int.fromLens = false
        }
        DM.setLensResults(results)
        if (int.fromLens) {
            if (colorIndex.value >= results[activeLens.value][refMode.value].length) {
                colorIndex.value = results[activeLens.value][refMode.value].length-1
            }
            colorColumn.value = results[activeLens.value][refMode.value][colorIndex.value].name

        } else {
            colorColumn.value = datasetColor.value
        }
        lensTime.value = Date.now()
        highlightAnnotations()
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



    async function init() {
        data.value = []
        int.scales = {}
        int.lenses = []
        int.fromLens = false
        int.showAttrMap = null
        int.attrLensPos = {}
        int.historyScales = {}
        history.clear()
        historyUpdated = false
        colorIndex.value = 0
        colorColumn.value = app.datasetColor
        annotations.value = []

        lensX = null;
        lensY = null;

        DM.setData()
        DM.setLensData()
        DM.setLensResults()

        const points = await d3.csv(`data/${props.dataset}.csv`, d3.autoType)

        columns.value = points.columns.filter(d => {
            const n = d.toLowerCase()
            return n !== "id" && n !== "x" && n !== "y" && !app.datasetObj.ignore.includes(n)
        })

        if (app.datasetObj.parse) {
            points.forEach(d => {
                columns.value.forEach(c => {
                    if (app.datasetObj.parse[c]) {
                        const s = d[c].replaceAll("'", '"')
                        d[c] = app.datasetObj.parse[c](s)
                    }
                })
            })
        }

        // set id if not part of dataset
        if (!points[0]["id"]) {
            points.forEach((d, i) => d.id = i)
        }

        for (let i = 1; i <= numLens.value; ++i) {
            int.lenses.push(new Lens(lensRadius.value*i, lensType.value))
        }

        const ct = [], scales = {}
        columns.value.forEach(c => {
            ct.push(getDataType(points[0], c))
            scales[c] = makeColorScale(points, c, ct.at(-1))
            int.historyScales[c] = d3.scaleSequential(d3.interpolateOrRd).domain([0, 1])
            int.attrLensPos[c] = []
        })
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
            lensRadius.value = Math.max(
                5,
                Math.min(
                    Math.max(w.value, h.value),
                    Math.round(lensRadius.value + event.deltaY * -0.05)
                )
            )
            int.lenses.forEach((l, i) => l.radius = lensRadius.value * (i+1))
            return false
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
                case "KeyL":
                    if (refMode.value !== "local") {
                        setRefMode("local")
                    }
                    break
                case "KeyG":
                    if (refMode.value !== "global") {
                        setRefMode("global")
                    }
                    break
                case "KeyA":
                    annotate()
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