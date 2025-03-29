<template>
    <div style="min-height: 80vh; max-width: 100vw;" class="d-flex flex-column align-center justify-start pa-4">
        <div v-if="data.length > 0" class="mt-2" style="max-width: 100%">
            <div style="text-align: center;" class="d-flex flex-column align-center">

                <div class="d-flex align-center justify-center mb-4" style="max-width: 80%;">
                    <div class="d-flex flex-column">
                        <v-btn v-for="(t, i) in LENS_TYPES" :key="'l_'+t"
                            class="mb-1"
                            :variant="t === lensType ? 'flat' : 'outlined'"
                            :color="Lens.getLensColor(t)"
                            @click="setLensType(t)">
                            {{ Lens.getLensName(t) }} ({{ KEYS[i] }})
                        </v-btn>
                    </div>

                    <div class="ml-4" style="max-width: 70%;">
                        <div v-if="ready" style="max-width: 100%;">
                            <v-text-field v-model="searchCol"
                                density="compact"
                                variant="outlined"
                                style="min-width: 500px;"
                                clearable
                                hide-details
                                hide-spin-buttons
                                class="mb-1"
                                label="search for column"/>

                            <div style="max-width: 100%; max-height: 3.3em; overflow-x: auto; text-align: left;">
                                <v-chip v-for="c in columMatches"
                                    class="text-caption mr-1 mb-1"
                                    :color="chosenColorAttr === c ? 'primary' : 'default'"
                                    @click="toggleColorOverride(c)"
                                    density="compact">
                                    {{ c.replaceAll('_', ' ') }}
                                </v-chip>
                            </div>
                        </div>
                        <div v-else style="min-width: 500px; max-width: 100%;">
                            <div class="mb-2">calculating feature maps</div>
                            <v-progress-circular indeterminate></v-progress-circular>
                        </div>
                    </div>

                    <!-- <BarChart :data="historyData"
                        :width="w-150"
                        @click="d => toggleShowAttr(d.x)"
                        :selected="int.showAttrMap ? [int.showAttrMap] : []"
                        selectable/> -->

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
                            <FeatureMap v-if="ready"
                                :column="chosenColorAttr"
                                :hide="int.filterAttr"
                                :mode="refMode"
                                :lens-type="lensType"
                                :width="w"
                                :height="h"/>

                            <ScatterPlot
                                style="position: absolute; top: 0; left: 0;"
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
                        <ColorLegend v-if="int.scales[chosenColorAttr]"
                            :key="chosenColorAttr"
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
                            <div v-for="mode in ['global', 'local']" class="d-flex align-center mb-1">
                                <div style="font-size: 12px; text-orientation: upright; writing-mode: vertical-lr;">{{ mode }}</div>
                                <div v-for="k in activeDetails" :key="'det_'+i+'_'+mode+'_'+k" class="text-caption">
                                    <div style="text-align: center;">{{ k+1 }}</div>
                                    <LensResults
                                        class="mr-1"
                                        :selected="i === activeLens+1 && colorIndex === k && refMode === mode"
                                        :disabled="int.lenses[i-1].numResults[refMode] < i"
                                        :lens="i-1"
                                        :index="k"
                                        :mode="mode"
                                        :time="lensTime"
                                        :width="150"
                                        :height="75"/>
                                    </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- <div class="mt-8 d-flex flex-column align-center" style="width: 100%;">
                <h4>Snapshots</h4>
                <div v-for="(s, i) in snapshots" :key="'snap_'+i" class="d-flex align-center">
                    <div class="ml-2 mr-2 text-caption" style="width: 300px;">
                        <div><b>Dataset:</b> {{ s.dataset }}</div>
                        <div><b>Lens:</b> {{ Lens.getLensName(s.lens) }}</div>
                        <div><b>Reference:</b> {{ s.reference }}</div>
                    </div>
                    <BarChart :data="s.data" :width="w"/>
                </div>
            </div> -->
        </div>
    </div>
</template>

<script setup>
    import * as d3 from 'd3'
    import ScatterPlot from './vis/ScatterPlot.vue'
    import { storeToRefs } from 'pinia'
    import { DATA_TYPES, useApp } from '@/stores/app';
    import { Lens, LENS_TYPE, LENS_TYPES } from '@/use/Lens';
    import { computed, reactive, toRaw } from 'vue';
    import LensResults from './LensResults.vue';
    import BarChart from './vis/BarChart.vue';
    import DM from '@/use/data-manager';
    import ColorLegend from './vis/ColorLegend.vue';
    import FilterDesc from './FilterDesc.vue';
    import { getAttr, getDataType, makeColorScale } from '@/use/util';
    import FeatureMap from './vis/FeatureMap.vue';
    import { useTheme } from 'vuetify';

    const app = useApp()
    const theme = useTheme()

    const { datasetX, datasetY, datasetColor } = storeToRefs(app)

    const props = defineProps({
        dataset: {
            type: String,
            default: "iris"
        }
    })

    const under = ref(null)
    const over = ref(null)

    const w = ref(600)
    const h = ref(600)

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
    const topFeatures = ref([])

    const columMatches = computed(() => {
        if (!searchCol.value || searchCol.value.length === 0) {
            return topFeatures.value
        }
        const regex = new RegExp(searchCol.value, "gi")
        return topFeatures.value.filter(d => regex.test(d))
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

    const ready = ref(false)

    const refMode = ref("global")
    const colorIndex = ref(0)
    const colorColumn = ref(datasetColor.value)
    const colorOverride = ref("")
    const colorType = computed(() => {
        const idx = columns.value.indexOf(chosenColorAttr.value)
        return idx >= 0 ? ctypes.value[idx] : null
    })

    const chosenColorAttr = computed(() => {
        if (int.fromLens) {
            return colorColumn.value
        }
        if (int.showAttrMap) {
            return int.showAttrMap
        }
        return colorOverride.value ? colorOverride.value : datasetColor.value
    })

    const moveLens = ref(true)

    const lensTime = ref(0)
    const lensType = ref(LENS_TYPE.RARE)
    const numLens = ref(1)
    const numDetails = reactive({
        local: 3,
        global: 3
    })
    const activeDetails = computed(() => {
        if (colorIndex.value > 0) {
            const s = colorIndex.value - 1
            return d3.range(s, Math.min(s + 3, numDetails[refMode.value]))
        } else {
            return d3.range(0, Math.min(3, numDetails[refMode.value]))
        }
    })

    const activeLens = ref(0)
    const lensRadius = ref(35)

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
        topFeatures.value = DM.getBestFeatures(lensType.value, refMode.value)
        applyLens()
    }
    function setColorIndex(i) {
        colorIndex.value = i
        colorColumn.value = DM.lensResults[activeLens.value][refMode.value][i].name
    }
    function setRefMode(mode="local") {
        const m = mode === "local" || mode === "global" ? mode : "local"
        if (m !== refMode.value) {
            saveHistory()
            topFeatures.value = DM.getBestFeatures(lensType.value, m)
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
                } else {
                    return []
                }
            })

            const now = Date.now()
            results.forEach((res, i) => {
                if (res.length > 0 && i === activeLens.value) {
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
                        }
                    }
                }
            })
        } else {
            int.fromLens = false
        }
        DM.setLensResults(results)
        if (int.fromLens && results[activeLens.value][refMode.value].length > 0) {
            if (colorIndex.value >= results[activeLens.value][refMode.value].length) {
                colorIndex.value = results[activeLens.value][refMode.value].length-1
            }
            colorColumn.value = results[activeLens.value][refMode.value][colorIndex.value].name

        } else {
            colorColumn.value = datasetColor.value
        }

        if (results[activeLens.value] !== undefined) {
            numDetails.local = results[activeLens.value].local.length
            numDetails.global = results[activeLens.value].global.length
        } else {
            numDetails.local = 3
            numDetails.global = 3
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
        topFeatures.value = []
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

        ready.value = false

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
            scales[c] = makeColorScale(points, c, ct.at(-1), theme.current.value.colors.primary)
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

        DM.setData(points, toRaw(columns.value), ct, "x", "y", w.value, h.value)

        data.value = points
        dataTime.value = Date.now()

        DM.computeFeatureMaps(lensRadius.value, 10, () => {
            topFeatures.value = DM.getBestFeatures(lensType.value, refMode.value)
            colorOverride.value = topFeatures.value[0]
            ready.value = true
        })
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
                case "ArrowLeft":
                    if (colorIndex.value > 0) {
                        setColorIndex(colorIndex.value - 1)
                    }
                    break;
                case "ArrowRight":
                    if (colorIndex.value < numDetails[refMode.value]-1) {
                        setColorIndex(colorIndex.value + 1)
                    }
                    break;

                case "Digit1":
                case "Digit2":
                case "Digit3":
                    const num = Number.parseInt(event.code.at(-1)) - 1
                    if (num < numLens.value && num !== activeLens.value) {
                        activeLens.value = num
                        setColorIndex(colorIndex.value)
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
                    if (event.ctrlKey) {
                        annotate()
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