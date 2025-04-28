<template>
<div style="min-height: 90vh; max-height: 95vh; max-width: 100vw;">
    <div style="width: 100%;" class="d-flex justify-center">
        <v-select
            :model-value="dataset"
            density="compact"
            style="max-width: 300px;"
            label="Dataset"
            item-title="name"
            item-value="file"
            hide-details
            hide-spin-buttons
            hide-no-data
            @update:model-value="v => app.setDataset(v)"
            :items="DATASETS"/>
    </div>
    <div v-if="!loading && data.length > 0" class="d-flex flex-column align-center justify-start mt-8">
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
                <div style="position: relative;">
                    <FeatureMap
                        :column="chosenColorAttr"
                        :hide="int.filterAttr!==null"
                        :mode="refMode"
                        :lens-type="lensType"
                        :time="featureTime"
                        style="margin: 0px 150px;"
                        :width="w"
                        :height="h"/>

                    <ScatterPlot
                        ref="scatter"
                        id="scatter-main"
                        style="position: absolute; top: 0; left: 0; margin: 0px 150px;"
                        :data="data"
                        :selected="dataF"
                        :time="dataTime"
                        :update="lensTime"
                        :x-attr="datasetX"
                        :y-attr="datasetY"
                        :color-attr="chosenColorAttr"
                        :color-scale="int.scales[chosenColorAttr]"
                        :radius="3"
                        :width="w"
                        :height="h"
                        show-lens
                        :fixed-lens="!moveLens"
                        :highlight-color="theme.current.value.colors.primary"
                        @hover="onHover"
                        @click-lens="onClickLens"/>

                    <svg ref="over" :width="w" :height="h" style="position: absolute; top: 0; left: 0; pointer-events: none;"></svg>
                </div>

            </div>

            <div class="d-flex ml-8">

                <LensComparison
                    class="mr-2"
                    :active="!moveLens"
                    :time="lensMoveTime"
                    :mode="refMode"
                    :selected-column="chosenColorAttr"/>

                <div>
                    <div class="text-caption">
                        <div style="max-width: 100px;" class="text-dots">{{ chosenColorAttr }} <span v-if="!int.fromLens">(default)</span></div>
                        <FilterDesc v-if="int.filterAttr !== null"
                            :data="int.filterValues"
                            :name="int.filterAttr"
                            @clear="setFilter(null)"
                            :ordinal="int.filterType === DATA_TYPES.ORDINAL || int.filterType === DATA_TYPES.NOMINAL || int.filterType === DATA_TYPES.BOOLEAN"
                            :scale="int.scales[int.filterAttr]"/>
                    </div>

                    <ColorLegend v-if="int.scales[chosenColorAttr]"
                        :key="chosenColorAttr"
                        :scale="int.scales[chosenColorAttr]"
                        :selected="chosenColorAttr === int.filterAttr ? int.filterValues : []"
                        :height="Math.min(300, h*0.45)"
                        style="display: block;"
                        @click="setFilter"
                        @brush="setFilter"/>

                    <ColorLegend v-if="ready"
                        :key="'cf_'+lensType"
                        :tick-format="featureScaleTicks"
                        :tick-values="[0, 1]"
                        :num-ticks="2"
                        style="display: block;"
                        class="mt-4"
                        :scale="featureScale"
                        :height="Math.min(300, h*0.45)"/>
                </div>
            </div>
        </div>


        <AnnotationOverlay
            target-id="scatter-main"
            :selected="chosenColorAttr"
            :time="annoTime"
            :active="!moveLens"/>

        <LensOverlay
            target="scatter-main"
            :time="lensTime"
            :radius="lensRadius-10"
            :mode="refMode"
            :index-primary="colorIndex"
            :index-secondary="colorIndexSec"
            :active-lens="activeLens"
            :indices="[0, 1]"/>

        <HotBar @annotate="annotate"/>

        <AnnoInventory/>

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
    import { DATA_TYPES, useApp, DATASETS } from '@/stores/app';
    import { LENS_TYPE } from '@/use/Lens';
    import { computed, reactive, toRaw } from 'vue';
    import DM from '@/use/data-manager';
    import ColorLegend from './vis/ColorLegend.vue';
    import FilterDesc from './FilterDesc.vue';
    import { findInCircle, getAttr, getDataType, makeColorScale } from '@/use/util';
    import FeatureMap from './vis/FeatureMap.vue';
    import { useTheme } from 'vuetify';
    import AnnotationOverlay from './AnnotationOverlay.vue';
    import LensOverlay from './LensOverlay.vue';
    import LensComparison from './LensComparison.vue';
    import { useWindowSize } from '@vueuse/core';
    import HotBar from './HotBar.vue';
    import { useControls } from '@/stores/controls';
    import AnnoInventory from './AnnoInventory.vue';
import INV from '@/use/inventory';

    const app = useApp()
    const controls = useControls()
    const theme = useTheme()

    const { dataset, datasetX, datasetY, datasetColor } = storeToRefs(app)

    const under = ref(null)
    const over = ref(null)
    const scatter = ref(null)

    const wSize = useWindowSize()
    const w = computed(() => {
        const ww = wSize.width.value
        const wh = wSize.height.value
        return Math.max(500, Math.floor(Math.min(ww*0.6, wh*0.75))-150)
    })
    const h = computed(() => w.value)

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
    const loading = ref(true)

    const refMode = ref("global")
    const colorIndex = ref(0)
    const colorIndexSec = ref(0)
    const columnIndex = computed(() => activeLens.value === 0 ? colorIndex.value : colorIndexSec.value)

    const colorColumn = ref(datasetColor.value)
    const colorColumnSec = ref(datasetColor.value)

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

    const annoTime = ref(0)
    const lensTime = ref(0)
    const lensMoveTime = ref(0)
    const featureTime = ref(0)

    const lensType = ref(LENS_TYPE.RARE)
    const numDetails = reactive({
        local: 3,
        global: 3
    })

    const activeLens = ref(0)
    const primaryLens = ref(0)
    const secondaryLens = ref(1)

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
        DM.lenses.forEach(l => l.type = t)
        applyLens()
        topFeatures.value = DM.getBestFeatures(lensType.value, refMode.value)
        app.setColor(topFeatures.value[0])
    }
    function setActiveLens(i) {
        if (i !== activeLens.value && i === primaryLens.value || i === secondaryLens.value) {
            activeLens.value = i
            setColorIndex(colorIndex.value)
        }
    }

    function setColorIndex(i) {
        const lens = DM.getLens(activeLens.value)
        i = Math.max(0, Math.min(i, lens.numResults[refMode.value]))
        if (activeLens.value === 0) {
            colorIndex.value = i
            colorColumn.value = lens.getResultColumn(refMode.value, i)
        } else {
            colorIndexSec.value = i;
            colorColumnSec.value = lens.getResultColumn(refMode.value, i)
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

    function annotate(color) {
        DM.annotate(
            activeLens.value,
            activeLens.value === 0 ? colorIndex.value : colorIndexSec.value,
            refMode.value,
            lensType.value,
            color
        )
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

    function applyLens() {
        if (DM.lenses.length === 0) return

        int.fromLens = DM.getLensResults(primaryLens.value, refMode.value).length > 0

        if (int.fromLens) {
            const now = Date.now()
            const lens = DM.getLens(primaryLens.value)

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
            if (columnIndex.value >= results.length) {
                if (activeLens.value === 0) {
                    colorIndex.value = 0
                } else {
                    colorIndexSec.value = 0
                }
            }

            if (activeLens.value === 0) {
                colorColumn.value = lens.getResultColumn(refMode.value, colorIndex.value)
            }

            numDetails.local = lens.numResults.local
            numDetails.global = lens.numResults.global
        } else {
            colorColumn.value = datasetColor.value
            colorColumnSec.value = datasetColor.value
            DM.clearLens(secondaryLens.value)
            numDetails.local = 3
            numDetails.global = 3
        }

        lensTime.value = Date.now()
    }

    function updateLens(lx, ly) {

        const lens = DM.getLens(activeLens.value)
        if (!lens) return

        const points = findInCircle(DM.tree, lx, ly, lens.radius)
        DM.updateLens(activeLens.value, lx, ly, lensRadius.value, points)

        if (activeLens.value === primaryLens.value && scatter.value) {
            const sugg = DM.getMatchingLenses(
                lens.x, lens.y, lens.radius,
                activeLens.value, refMode.value,
                colorIndex.value
            )

            if (sugg.length === 0) {
                DM.clearLens(secondaryLens.value)
            } else {
                const suggPoints = findInCircle(DM.tree, sugg[0][0], sugg[0][1], lens.radius)
                DM.updateLens(secondaryLens.value, sugg[0][0], sugg[0][1], lens.radius, suggPoints)
            }
        }
    }

    function onHover(lx, ly) {
        if (activeLens.value === 0) {
            colorIndex.value = 0;
        } else {
            colorIndexSec.value = 0;
        }
        updateLens(lx, ly)
        applyLens()
    }
    function onClickLens(lx, ly, id) {
        const act = DM.getLens(activeLens.value)
        if (act.id !== id) {
            setActiveLens(DM.getLensIndex(id))
            moveLens.value = true
        } else {
            moveLens.value = !moveLens.value
        }
        updateLens(lx, ly)
        applyLens()
        lensMoveTime.value = Date.now()
    }

    async function init() {
        loading.value = true

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
        colorIndexSec.value = 0
        colorColumn.value = app.datasetColor
        colorColumnSec.value = app.datasetColor
        moveLens.value = true

        ready.value = false

        DM.reset()

        const points = await d3.csv(`data/${dataset.value}.csv`, d3.autoType)
        columns.value = points.columns.filter(d => {
            const n = d.toLowerCase()
            return n !== "id" && n !== "x" && n !== "y" && !app.datasetObj.ignore.includes(d)
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

        loading.value = false

        data.value = points
        dataTime.value = Date.now()
        annoTime.value = Date.now()

        refreshFeatureMaps()
    }

    function refreshFeatureMaps() {
        ready.value = false
        DM.computeFeatureMaps(lensRadius.value, 10, () => {
            topFeatures.value = DM.getBestFeatures(lensType.value, refMode.value)
            // app.setColor(topFeatures.value.at(-1))
            ready.value = true
            const lens = DM.getLens(0)
            updateLens(lens.x, lens.y)
            applyLens()
            featureTime.value = Date.now()
        })
    }

    onMounted(function() {
        // static hotkeys
        controls.setKeyMappingLocked(0, "s", "save", function() {
            const graph = DM.getAnnotationConnections()
            graph.links.forEach(d => {
                const s = graph.nodes.find(n => n.id === d.source)
                const t = graph.nodes.find(n => n.id === d.target)
                d.coords = [[s.x, s.y], [t.x, t.y]]
            })

            INV.add(dataset.value, DM.getAnnotations(), graph.links)
            DM.clearAnnotations()
        })

        controls.setKeyMappingLocked(1, "a", "prev", function() {
            if (columnIndex.value > 0) {
                setColorIndex(columnIndex.value - 1)
                applyLens()
            }
        })
        controls.setKeyMappingLocked(2, "d", "next", function() {
            setColorIndex(columnIndex.value + 1)
            applyLens()
        })
        controls.setKeyMappingLocked(3, "l", "local", function() {
            if (refMode.value !== "local") {
                setRefMode("local")
                applyLens()
            }
        })
        controls.setKeyMappingLocked(4, "g", "global", function() {
            if (refMode.value !== "global") {
                setRefMode("global")
                applyLens()
            }
        })

        // annotation hotkeys
        const annoFunc = keymap => annotate(keymap.color)
        controls.setKeyMapping(5, "1", "group 1", annoFunc)
        controls.setKeyMapping(6, "2", "group 2", annoFunc)
        controls.setKeyMapping(7, "3", "group 3", annoFunc)
        controls.setKeyMapping(8, "4", "group 4", annoFunc)
        controls.setKeyMapping(9, "5", "group 5", annoFunc)

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

        DM.onLens(() => {
            lensTime.value = Date.now()
            lensMoveTime.value = Date.now()
        })
        DM.onAnnotation(() => {
            annoTime.value = Date.now()
        })

        init()
    })

    watch(dataset, init)
</script>