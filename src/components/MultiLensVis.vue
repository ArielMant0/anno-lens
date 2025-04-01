<template>
    <div style="min-height: 80vh; max-width: 100vw;" class="d-flex flex-column align-center justify-start pa-4">
        <div v-if="data.length > 0" class="mt-2" style="max-width: 100%">

            <LensOverlay
                target="scatter-main"
                :time="lensTime"
                :mode="refMode"
                :index="colorIndex"
                :selected-column="chosenColorAttr"
                :indices="[0, 1]"/>

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
                                    :color="colorOverride === c ? 'secondary' : (colorColumn === c ? 'primary' : 'default')"
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

                    <ColorLegend v-if="ready"
                        :key="'cf_'+lensType"
                        :tick-format="featureScaleTicks"
                        :tick-values="[0, 1]"
                        :num-ticks="2"
                        :scale="featureScale"
                        :height="100"/>

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
                                :ordinal="int.filterType === DATA_TYPES.ORDINAL || int.filterType === DATA_TYPES.NOMINAL || int.filterType === DATA_TYPES.BOOLEAN"
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
                                ref="scatter"
                                id="scatter-main"
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
                                :num-lens="numLens"
                                :active-lens="activeLens"
                                :fixed-lens="!moveLens"
                                :highlight-color="theme.current.value.colors.primary"
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
                        <div class="d-flex align-center">
                            <div class="mr-1" style="font-size: 12px; text-align: center; text-orientation: upright; writing-mode: vertical-lr;">all data</div>
                            <GlobalDistributions
                                :lens="activeLens"
                                :index="colorIndex"
                                :mode="refMode"
                                :time="lensTime"
                                :width="150"
                                :height="75"/>
                        </div>
                        <v-divider class="mt-4 mb-4"></v-divider>
                        <div class="d-flex align-center">
                            <v-icon color="red" size="small" class="mr-1">mdi-circle-outline</v-icon>
                            <LensResults
                                :lens="activeLens"
                                :index="colorIndex"
                                :selected="colorColumn"
                                :mode="refMode"
                                :time="lensTime"
                                @go-left="setColorIndex(colorIndex-1)"
                                @go-right="setColorIndex(colorIndex+1)"
                                :width="150"
                                :height="75"/>
                        </div>
                        <div class="d-flex align-center mt-4">
                            <v-icon color="black" size="small" class="mr-1">mdi-circle-outline</v-icon>
                            <LensResults
                                :lens="suggestLens"
                                :index="colorIndex"
                                :mode="refMode"
                                :time="lensTime"
                                @go-left="setColorIndex(colorIndex-1)"
                                @go-right="setColorIndex(colorIndex+1)"
                                :width="150"
                                :height="75"/>
                        </div>
                    </div>
                </div>
            </div>

            <AnnotationOverlay
                target-id="scatter-main"
                :selected="chosenColorAttr"
                :time="annoTime"
                :active="!moveLens"/>

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
    import { deg2rad, getAttr, getDataType, makeColorScale } from '@/use/util';
    import FeatureMap from './vis/FeatureMap.vue';
    import { useTheme } from 'vuetify';
    import AnnotationOverlay from './AnnotationOverlay.vue';
    import GlobalDistributions from './GlobalDistributions.vue';
    import LensOverlay from './LensOverlay.vue';

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
    const scatter = ref(null)

    const w = ref(800)
    const h = ref(800)

    const data = ref([])
    const dataF = computed(() => {
        if (int.filterAttr === null) return []
        if (int.filterType === DATA_TYPES.ORDINAL || DATA_TYPES.NOMINAL || int.filterType === DATA_TYPES.BOOLEAN) {
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
        columns: [],
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
        if (colorOverride.value.length > 0) {
            return colorOverride.value
        }

        if (int.fromLens) {
            return colorColumn.value
        }
        if (int.showAttrMap) {
            return int.showAttrMap
        }

        return datasetColor.value
    })

    const moveLens = ref(true)

    const lensSuggest = ref([])

    const annoTime = ref(0)
    const lensTime = ref(0)
    const lensType = ref(LENS_TYPE.RARE)
    const numLens = ref(1)
    const numDetails = reactive({
        local: 3,
        global: 3
    })

    const activeLens = ref(0)
    const suggestLens = ref(1)
    const lensRadius = ref(35)

    const KEYS = ["Q", "W"]

    const featureScale = computed(() => {
        if (lensType.value === LENS_TYPE.FREQUENT) {
            // return d3.scaleSequential(d3.interpolateGreys)
            return d3.scaleSequential(t => d3.interpolateGreys(1-t))
        }
        return d3.scaleSequential(d3.interpolateGreys)
    })
    const featureScaleTicks = computed(() => {
        if (lensType.value === LENS_TYPE.FREQUENT) {
            return d => d < 1 ? "less frequent" : "more frequent"
        }
            return d => d < 1 ? "less rare" : "more rare"
    })

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
        app.setColor(topFeatures.value[0])
        applyLens()
    }
    function setColorIndex(i) {
        const lens = DM.getLens(activeLens.value)
        if (i >= 0 && i < lens.numResults[refMode.value]) {
            colorIndex.value = i
            colorColumn.value = lens.getResultColumn(refMode.value, i)
        }
    }
    function setRefMode(mode="local") {
        const m = mode === "local" || mode === "global" ? mode : "local"
        if (m !== refMode.value) {
            saveHistory()
            topFeatures.value = DM.getBestFeatures(lensType.value, m)
            app.setColor(topFeatures.value[0])
            refMode.value = m
        }
    }

    function annotate() {
        DM.annotate(
            activeLens.value,
            lensRadius.value,
            colorIndex.value,
            refMode.value,
        )
        annoTime.value = Date.now()
    }

    function setFilter(values) {
        if (values !== null) {
            const attr = chosenColorAttr.value
            int.filterType = colorType.value
            switch(int.filterType) {
                case DATA_TYPES.BOOLEAN:
                case DATA_TYPES.NOMINAL:
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
        if (DM.lenses.length === 0) return

        int.fromLens = DM.getLensResults(activeLens.value, refMode.value).length > 0

        if (int.fromLens) {
            const now = Date.now()
            const lens = DM.getLens(activeLens.value)

            const n = lens.getResultColumn(refMode.value, colorIndex.value)
            const val = (history.get(n) || 0) + 1

            int.historyScales[n].domain([0, Math.max(val, int.historyScales[n].domain()[1])])
            historyUpdated = true

            if (lens.x !== null && lens.y !== null) {
                int.attrLensPos[n].push({
                    x: lens.x,
                    y: lens.y,
                    time: now,
                    radius: lensRadius.value
                })
            }

            const results = lens.getResult(refMode.value)
            if (colorIndex.value >= results.length) {
                colorIndex.value = 0
            }
            colorColumn.value = lens.getResultColumn(refMode.value, colorIndex.value)

            numDetails.local = lens.numResults.local
            numDetails.global = lens.numResults.global
        } else {
            colorColumn.value = datasetColor.value
            DM.clearLens(suggestLens.value)
            numDetails.local = 3
            numDetails.global = 3
        }

        lensTime.value = Date.now()
        // drawLensSuggestions()
        // highlightAnnotations()
    }

    function updateLens(points, lx, ly) {

        const fd = DM.getData()

        points.forEach(list => {
            const ids = new Set(list)
            const subset = fd.filter(d => {
                if (ids.has(d.id)) {
                    d.visited[colorColumn.value]++
                }
                return ids.has(d.id)
            })
            DM.updateLens(activeLens.value, lx, ly, lensRadius.value, subset)
        })

        if (scatter.value) {
            const lens = DM.getLens(activeLens.value)
            const sugg = DM.getMatchingLenses(
                lens.x, lens.y, lensRadius.value,
                activeLens.value, refMode.value,
                colorIndex.value
            )

            if (sugg.length === 0) {
                DM.clearLens(suggestLens.value)
            } else {
                const list = scatter.value.getLensData(sugg[0][0], sugg[0][1], 1, lensRadius.value)
                const ids = new Set(list[activeLens.value])
                const subset = fd.filter(d => ids.has(d.id))
                DM.updateLens(suggestLens.value, sugg[0][0], sugg[0][1], lensRadius.value, subset)
            }
        }
    }

    function onHover(points, lx, ly) {
        updateLens(points, lx, ly)
        applyLens()
    }
    function onClick(points, lx, ly) {
        moveLens.value = !moveLens.value;
        updateLens(points, lx, ly)
        applyLens()
    }

    async function init() {
        data.value = []
        topFeatures.value = []
        int.scales = {}
        int.mainLens = null
        int.columns = []
        int.otherColumns = []
        int.fromLens = false
        int.showAttrMap = null
        int.attrLensPos = {}
        int.historyScales = {}
        history.clear()
        historyUpdated = false
        colorIndex.value = 0
        colorColumn.value = app.datasetColor

        ready.value = false

        DM.reset()

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

        // add primary lens
        DM.addLens(lensType.value, true)
        // add secondary lens (for suggestions)
        DM.addLens(lensType.value, false)

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

        DM.setDataset(app.datasetObj)
        DM.setData(points, toRaw(columns.value), ct, "x", "y", w.value, h.value)

        data.value = points
        dataTime.value = Date.now()
        annoTime.value = Date.now()

        refreshFeatureMaps()
    }

    function refreshFeatureMaps() {
        ready.value = false
        DM.computeFeatureMaps(lensRadius.value, 10, () => {
            topFeatures.value = DM.getBestFeatures(lensType.value, refMode.value)
            app.setColor(topFeatures.value[0])
            ready.value = true
        })
    }

    onMounted(function() {
        window.addEventListener("wheel", function(event) {
            if (!event.ctrlKey) return
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
            refreshFeatureMaps()
            return false
        })
        window.addEventListener("keydown", function(event) {
            switch(event.code) {
                case "ArrowUp":
                case "ArrowLeft":
                    if (colorIndex.value > 0) {
                        setColorIndex(colorIndex.value - 1)
                    }
                    break;
                case "ArrowDown":
                case "ArrowRight":
                    if (colorIndex.value < numDetails[refMode.value]-1) {
                        setColorIndex(colorIndex.value + 1)
                    }
                    break;
            }
        })
        window.addEventListener("keyup", function(event) {
            switch(event.code) {
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
                    if (event.shiftKey) {
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