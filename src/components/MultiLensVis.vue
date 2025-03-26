<template>
    <div style="min-height: 80vh;" class="d-flex flex-column align-center justify-center">
        <div v-if="data.length > 0" class="mt-2">
            <div style="text-align: center;">
                <div class="d-flex align-center">
                    <div class="d-flex flex-column mr-2">
                        <v-btn v-for="(t, i) in LENS_TYPES" :key="'l_'+t"
                            density="comfortable"
                            class="mb-1"
                            :color="lensType === t ? 'primary' : 'default'"
                            @click="setLensType(t)">
                            {{ Lens.getLensName(t) }} ({{ KEYS[i] }})
                        </v-btn>
                    </div>
                    <BarChart :data="historyData" :width="w-150"/>
                </div>

                <div class="d-flex">
                    <div>
                        <div :style="{ width: w+'px' }">Color Attribute: {{ colorColumn }} <span v-if="!int.fromLens">(default)</span></div>
                        <ScatterPlot
                            :data="data"
                            :time="dataTime"
                            :update="lensTime"
                            :x-attr="datasetX"
                            :y-attr="datasetY"
                            :color-attr="colorColumn"
                            :color-scale="int.scales[colorColumn]"
                            :radius="3"
                            :search-radius="lensRadius"
                            class="mr-2"
                            :width="w"
                            :height="h"
                            show-lens
                            :num-lens="numLens"
                            :active-lens="activeLens"
                            @hover="onHover"
                            @click="onClick"/>
                    </div>

                    <div style="margin-top: 25px">
                        <div v-for="i in numLens" :key="'det_'+i" class="mb-2 d-flex align-center">
                            <LensResults v-for="j in 3" :key="'v_'+i+'_'+j"
                                class="mr-1"
                                :selected="i === activeLens+1"
                                :lens="i-1"
                                :index="j-1"
                                :time="lensTime"
                                :width="150"
                                :height="75"/>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div v-for="(s, i) in snapshots" :key="'snap_'+i" class="d-flex align-center">
                    <div class="mr-2 text-caption" style="width: 150px;">{{ Lens.getLensName(s.lens) }}</div>
                    <BarChart :data="s.data" :width="w-150"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import ScatterPlot from './ScatterPlot.vue'
    import { csv, autoType, scaleSequential, interpolateTurbo, extent, schemeCategory10, scaleOrdinal, group } from 'd3'
    import { storeToRefs } from 'pinia'
    import { DATA_TYPES, useApp } from '@/stores/app';
    import { Lens, LENS_TYPE, LENS_TYPES } from '@/use/Lens';
    import { computed, reactive } from 'vue';
    import LensResults from './LensResults.vue';
    import BarChart from './vis/BarChart.vue';
    import DM from '@/use/data-manager';

    const app = useApp()

    const { datasetX, datasetY, datasetColor } = storeToRefs(app)

    const props = defineProps({
        dataset: {
            type: String,
            default: "iris"
        }
    })

    const w = ref(800)
    const h = ref(500)

    const data = ref([])
    const dataTime = ref(0)
    const columns = ref([])
    const ctypes = ref([])

    const int = reactive({
        scales: {},
        lenses: [],
        columns: [],
        types: [],
        fromLens: false,
    })

    const history = reactive(new Map())
    const historyData = computed(() => {
        const list = []
        history.forEach((v, k) => list.push({ x: k, y: v }))
        return list
    })
    const snapshots = ref([])

    const colorColumn = ref(datasetColor.value)

    const lensTime = ref(0)
    const lensType = ref(LENS_TYPE.RARE)
    const activeLens = ref(0)
    const numLens = ref(3)
    const lensRadius = ref(10)

    const KEYS = ["Q", "W", "E"]

    function getDataType(d) {
        switch (typeof d) {
            default:
            case 'number':
                return DATA_TYPES.SEQUENTIAL
            case 'string':
                return DATA_TYPES.ORDINAL
        }
    }

    function saveHistory() {
        snapshots.value.push({
            time: Date.now(),
            dataset: app.dataset,
            lens: lensType.value,
            data: historyData.value
        })
        history.clear()
    }
    function setLensType(t) {
        saveHistory()
        lensType.value = t;
        int.lenses.forEach(l => l.type = t)
        applyLens()
    }
    function applyLens() {
        const lensData = DM.lensData
        if (lensData.length === 0) return

        let cols = [];
        if (lensData.some(d => d.length > 0)) {
            int.fromLens = true
            cols = int.lenses.map((d, i) => d.apply(lensData[i], columns.value, ctypes.value))
            cols.forEach(c => history.set(c[0].name, (history.get(c[0].name) || 0) + 1))
        } else {
            int.fromLens = false
            cols = int.lenses.map(() => columns.value.map(d => ({ name: d, value: 0 })))
        }
        colorColumn.value = cols[activeLens.value][0].name
        const types = cols.map(c => getDataType(data.value[0][c[0].name]))
        DM.setLensColumns(cols)
        DM.setLensTypes(types)
        lensTime.value = Date.now()
    }
    function onHover(points) {
        DM.setLensData(points.map(list => {
            const ids = new Set(list)
            return data.value.filter(d => ids.has(d.id))
        }))
        applyLens()
    }
    function onClick() {
        console.log("TODO on click")
    }

    function makeScale(data, column, type) {
        switch(type) {
            case DATA_TYPES.SEQUENTIAL:
                return scaleSequential(interpolateTurbo)
                    .unknown("grey")
                    .domain(extent(data, d => d[column]))
            default:
            case DATA_TYPES.ORDINAL:
                const tmp = group(data, d => d[column])
                const dom = Array.from(tmp.keys())
                dom.sort()
                return scaleOrdinal(schemeCategory10).domain(dom).unknown("black")
        }
    }

    async function init() {
        data.value = []
        int.scales = {}
        int.lenses = []
        int.fromLens = false
        history.clear()
        colorColumn.value = app.datasetColor

        DM.setData()
        DM.setLensData()

        const points = await csv(`/data/${props.dataset}.csv`, autoType)
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
        })
        DM.setLensColumns(columns.value.map(d => ({ name: d, value: 0 })))
        DM.setLensTypes(ct)
        DM.setScales(scales)

        int.scales = scales
        ctypes.value = ct

        DM.setData(points)
        data.value = points
        dataTime.value = Date.now()
    }

    onMounted(function() {
        window.addEventListener("wheel", function(event) {
            lensRadius.value = Math.max(
                5,
                Math.min(
                    Math.max(w.value, h.value),
                    Math.round(lensRadius.value + event.deltaY * -0.05)
                )
            )
        })
        window.addEventListener("keyup", function(event) {
            switch(event.code) {
                case "Digit1":
                    activeLens.value = 0
                    break
                case "Digit2":
                    activeLens.value = 1
                    break
                case "Digit3":
                    activeLens.value = 2
                    break
                default:
                    const i = KEYS.findIndex(d => "Key"+d === event.code)
                    if (i >= 0) {
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