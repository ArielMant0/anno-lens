<template>
    <div style="min-height: 80vh;" class="d-flex flex-column align-center justify-center">
        <InteractionLayers
            :style="{ width: w+'px'}"
            :width="Math.floor(w/5-5)"
            :height="Math.floor(h/5-5)"
            :move="int.move"
            :hover="int.hover"
            :click="int.click"/>
        <ScatterPlot v-if="data.length > 0" :data="data"
            :x-attr="datasetX"
            :y-attr="datasetY"
            :color-attr="datasetColor"
            :color-type="colorType"
            :radius="3"
            :search-radius="lensRadius"
            class="mt-2"
            :width="w"
            :height="h"
            show-lens
            @move="addMove"
            @hover="addHover"
            @click="addClick"/>
    </div>
</template>

<script setup>
    import ScatterPlot from './ScatterPlot.vue'
    import { csv, autoType, pointer } from 'd3'
    import { storeToRefs } from 'pinia'
    import { useApp } from '@/stores/app';
    import { useTooltip } from '@/stores/tooltip';
    import InteractionLayers from './InteractionLayers.vue';

    const app = useApp()
    const tt = useTooltip()

    const { datasetX, datasetY, datasetColor, colorType } = storeToRefs(app)

    const props = defineProps({
        dataset: {
            type: String,
            default: "iris"
        }
    })

    const w = ref(800)
    const h = ref(500)

    const data = ref([])
    const int = reactive({
        move: [],
        hover: [],
        click: []
    })

    const lensRadius = ref(10)

    const windowSize = ref(5000)
    const offset = computed(() => Math.floor(windowSize.value * 0.1))

    function makeItemTooltip(d) {
        return `
        <tr class="mb-1">
            <td class="pr-2">${datasetX.value}: <b>${d[datasetX.value]}</b></td>
            <td class="pr-1 pl-1">${datasetY.value}: <b>${d[datasetY.value]}</b></td>
            <td class="pl-2">${datasetColor.value}: <b>${d[datasetColor.value]}</b></td>
        </tr>
        `
    }

    function addMove(coords) {
        let arr = int.move.concat(coords)
        if (arr.length > windowSize.value) {
            arr = arr.slice(offset.value, arr.length)
        }
        int.move = arr
    }

    function addHover(coords, event, data) {
        if (coords.length > 0) {
            let arr = int.hover.concat(coords)
            if (arr.length > windowSize.value) {
                arr = arr.slice(offset.value, arr.length)
            }
            int.hover = arr
            const [mx, my] = pointer(event, document.body)
            const tmp = data.slice(0, 3).reduce((acc,d) => acc + makeItemTooltip(d), '')
            const extra = data.length > 3 ? `<div>and ${data.length-3} more..</div>` : ''
            tt.show(`<div class="pa-1 text-caption"><table class="mb-1">${tmp}</table>${extra}</div>`, mx, my)
        } else {
            tt.hide()
        }
        const [px, py] = pointer(event, event.target)
        const { width, height } = event.target.getBoundingClientRect()
        addMove([[px / width, py / height]])
    }
    function addClick(coords) {
        let arr = int.click.concat(coords)
        if (arr.length > windowSize.value) {
            arr = arr.slice(offset.value, arr.length)
        }
        int.click = arr
    }

    async function init() {
        data.value = []
        int.move = []
        int.hover = []
        int.click = []
        data.value = await csv(`/data/${props.dataset}.csv`, autoType)
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
        init()
    })

    watch(props, init, { deep: true })
</script>