<template>
    <div>
        <Teleport to="body">
            <canvas ref="annolinks"
                :width="width"
                :height="height"
                class="overlay"
                :style="{
                    left: (offsetX+padding)+'px',
                    top: (offsetY)+'px',
                    pointerEvents: 'none',
                }">
            </canvas>
        </Teleport>

        <Teleport to="body">
            <svg
                :width="width"
                :height="height"
                class="overlay"
                :style="{
                    left: (offsetX+padding)+'px',
                    top: (offsetY)+'px',
                    pointerEvents: 'none'
                }">
                <g v-for="a in anno" :opacity="active && !selectedAnnos[a.id] ? 0.75 : 1">
                    <g v-for="(p, idx) in a.polygon" :key="a.id+'_'+idx">
                        <circle v-if="p.length === 1"
                            :cx="p[0]"
                            :cy="p[1]"
                            :r="5"
                            :fill="a.color ? a.color : '#333'"
                            stroke="black"
                            stroke-dasharray="4 2"
                            :stroke-width="selectedAnnos[a.id] ? 3 : 2"
                            >
                        </circle>
                        <line v-else-if="props.length === 2"
                            :x1="p[0][0]"
                            :y1="p[0][1]"
                            :x2="p[1][0]"
                            :y2="p[1][1]"
                            :stroke-width="selectedAnnos[a.id] ? 3 : 2"
                            :stroke="a.color ? a.color : 'black'"
                            stroke-dasharray="4 2"
                            fill="none">
                        </line>
                        <path v-else
                            :d="d3.line().curve(d3.curveCardinalClosed)(p)"
                            :stroke-width="selectedAnnos[a.id] ? 3 : 2"
                            :stroke="a.color ? a.color : 'black'"
                            stroke-dasharray="4 2"
                            fill-opacity="0.25"
                            :fill="selectedAnnos[a.id] ? (a.color ? a.color : 'black') : 'none'">
                        </path>
                    </g>
                </g>
            </svg>
        </Teleport>

        <Teleport to="body">
            <div style="z-index: 4999;">
                <div v-for="a in annoLeft"
                    :key="a.id+'_l_'+annoPos[a.id].index"
                    class="d-flex align-center anno-container"
                    @pointerenter="hoverAnno = a.id"
                    @pointerleave="hoverAnno = null"
                    draggable="true"
                    @dragstart="onDragAnno(a)"
                    @dragover.prevent="onDragOver"
                    @drop.prevent="onDropAnno(a)"
                    :style="{
                        position: 'absolute',
                        left: (offsetX+getAnnotationPos(a.id, true)[0]-25)+'px',
                        top: (offsetY+getAnnotationPos(a.id, true)[1])+'px',
                        fontSize: '12px',
                    }">

                    <div>
                        <div>
                            <v-btn
                                class="del-anno"
                                color="error"
                                variant="text"
                                rounded="sm"
                                size="sm"
                                icon="mdi-delete"
                                density="compact"
                                @click="DM.removeAnnotation(a.id)"/>
                        </div>

                        <div v-for="i in 5">
                            <v-btn
                                class="add-anno"
                                :color="controls.getColor(i+4)"
                                variant="text"
                                rounded="sm"
                                size="sm"
                                icon="mdi-plus"
                                density="compact"
                                @click="annotate(a.id, i+4)"/>
                        </div>
                    </div>

                    <div
                        class="ma-1 pa-1"
                        :style="{
                            border: (selectedAnnos[a.id] ? 2 : 1) + 'px solid black',
                            borderRadius: '4px',
                            opacity: selectedAnnos[a.id] ? 1 : 0.75,
                            overflowX: 'hidden',
                            overflowY: 'auto',
                            minHeight: (annoMeta.sizeL-2)+'px',
                            maxHeight: (annoMeta.sizeL-2)+'px',
                            fontSize: '12px',
                            minWidth: padding+'px',
                            maxWidth: padding+'px',
                        }">

                        <div v-for="c in a.columns" class="d-flex">
                            <v-btn
                                color="error"
                                variant="text"
                                rounded="sm"
                                size="sm"
                                icon="mdi-close"
                                density="compact"
                                @click="DM.removeAnnotationColumn(a.id, c.name)"/>

                            <div
                                class="text-dots cursor-pointer"
                                @pointerenter="hoverAnnoCol = c.name"
                                @pointerleave="hoverAnnoCol = null"
                                @click="selectColor(c.name)"
                                :style="{
                                    color: c.color,
                                    fontWeight: selectedColums[c.name] ? 'bold' : 'normal',
                                    maxWidth: (padding-15)+'px'
                                }">
                                {{ c.name }} <span v-if="c.value !== null">({{ c.value }})</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-for="a in annoRight"
                    :key="a.id+'_r_'+annoPos[a.id].index"
                    class="d-flex align-center anno-container"
                    @pointerenter="hoverAnno = a.id"
                    @pointerleave="hoverAnno = null"
                    draggable="true"
                    @dragstart="onDragAnno(a)"
                    @dragover.prevent="onDragOver"
                    @drop.prevent="onDropAnno(a)"
                    :style="{
                        position: 'absolute',
                        left: (offsetX+getAnnotationPos(a.id, true)[0])+'px',
                        top: (offsetY+getAnnotationPos(a.id, true)[1])+'px',
                        fontSize: '12px',
                    }">

                    <div
                        class="ma-1 pa-1"
                        :style="{
                            border: (selectedAnnos[a.id] ? 2 : 1) + 'px solid black',
                            borderRadius: '4px',
                            opacity: selectedAnnos[a.id] ? 1 : 0.75,
                            overflowX: 'hidden',
                            overflowY: 'auto',
                            minHeight: (annoMeta.sizeR-2)+'px',
                            maxHeight: (annoMeta.sizeR-2)+'px',
                            fontSize: '12px',
                            minWidth: padding+'px',
                            maxWidth: padding+'px',
                        }">

                        <div v-for="c in a.columns" class="d-flex">
                            <v-btn
                                color="error"
                                variant="text"
                                rounded="sm"
                                size="sm"
                                icon="mdi-close"
                                density="compact"
                                @click="DM.removeAnnotationColumn(a.id, c.name)"/>

                            <div
                                class="text-dots cursor-pointer"
                                @pointerenter="hoverAnnoCol = c.name"
                                @pointerleave="hoverAnnoCol = null"
                                @click="selectColor(c.name)"
                                :style="{
                                    color: c.color,
                                    fontWeight: selectedColums[c.name] ? 'bold' : 'normal',
                                    maxWidth: (padding-15)+'px'
                                }">
                                {{ c.name }} <span v-if="c.value !== null">({{ c.value }})</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div>
                            <v-btn
                                class="del-anno"
                                color="error"
                                variant="text"
                                rounded="sm"
                                size="sm"
                                icon="mdi-delete"
                                density="compact"
                                @click="DM.removeAnnotation(a.id)"/>
                        </div>

                        <div v-for="i in 5">
                            <v-btn
                                class="add-anno"
                                :color="controls.getColor(i+4)"
                                variant="text"
                                rounded="sm"
                                size="sm"
                                icon="mdi-plus"
                                density="compact"
                                @click="annotate(a.id, i+4)"/>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
    import * as d3 from 'd3'
    import DM from '@/use/data-manager';
    import { useMouse, useWindowScroll, useWindowSize } from '@vueuse/core';
    import { computed, onMounted, reactive, watch } from 'vue';
    import { euclidean } from '@/use/util';
    import { useApp } from '@/stores/app';
    import { useControls } from '@/stores/controls';

    const app = useApp()
    const mouse = useMouse()
    const controls = useControls()

    const props = defineProps({
        targetId: {
            type: String,
            required: true
        },
        active: {
            type: Boolean,
            required: true
        },
        time: {
            type: Number,
            default: 0
        },
        selected: {
            type: String,
            default: ""
        },
        tolerance: {
            type: Number,
            default: 50
        },
        padding: {
            type: Number,
            default: 150
        },
    })

    const emit = defineEmits(["select-color"])

    const scroll = useWindowScroll()

    const annolinks = ref(null)

    const offsetX = ref(0)
    const offsetY = ref(0)
    const width = ref(0)
    const height = ref(0)

    const anno = ref([])
    const annoLeft = ref([])
    const annoRight = ref([])

    const annoPos = ref({})
    const annoMeta = reactive({
        sizeL: 15,
        sizeR: 15,
    })

    let actx, annoFontSize = () => 14

    let targetRect = null, dragAnno = null;

    const graph = {
        nodes: [],
        links: []
    }

    const wSize = useWindowSize()

    const hoverAnno = ref(null)
    const hoverAnnoCol = ref("")
    const selectedAnnos = computed(() => {
        const obj = {}
        const inside = mouse.x.value >= offsetX.value + props.padding &&
            mouse.x.value <= offsetX.value + props.padding + targetRect.width &&
            mouse.y.value >= offsetY.value &&
            mouse.y.value <= offsetX.value + targetRect.height

        const mx = mouse.x.value - offsetX.value - props.padding
        const my = mouse.y.value - offsetY.value
        anno.value.forEach(a => obj[a.id] = isSelected(a) || inside && a.polygon.some(p => d3.polygonContains(p, [mx, my])))
        return obj
    })
    const selectedColums = computed(() => {
        const obj = {}
        anno.value.forEach(a => {
            a.columns.forEach(c => obj[c.name] = isSelectedColumn(c.name))
        })
        return obj
    })

    function selectColor(name) {
        emit("select-color", name)
    }

    function onDragAnno(anno) {
        dragAnno = anno
    }

    function onDropAnno(anno) {
        if (dragAnno !== null) {
            // trigger merge
            if (dragAnno.id !== anno.id) {
                DM.mergeAnnotations(anno.id, dragAnno.id)
            }
            dragAnno = null
        }
    }

    function onDragOver(event) {
        event.dataTransfer.dropEffect = "move"
    }

    function getAnnotationPos(id, usePadding=false) {
        const pos = annoPos.value[id]
        if (!pos) return [0, 0]
        switch(pos.side) {
            case "left": return [-5, pos.index*annoMeta.sizeL]
            default:
            case "right": return [(usePadding ? props.padding : 0)+targetRect.width+5, pos.index*annoMeta.sizeR]
        }
    }

    function getCoordinates() {
        const target = document.querySelector("#"+props.targetId)
        if (!target) return
        const rect = target.getBoundingClientRect()
        offsetX.value = rect.left - props.padding
        offsetY.value = rect.top + scroll.y.value
        width.value = rect.width
        height.value = rect.height
        targetRect = rect
    }

    function isSelected(annotation) {
        return hoverAnno.value === annotation.id || annotation.columns.some(c => isSelectedColumn(c.name))
    }
    function isSelectedColumn(name) {
        return props.selected === name || hoverAnnoCol.value === name
    }

    function drawLinks() {
        actx = actx ? actx : annolinks.value.getContext("2d")
        actx.clearRect(0, 0, width.value, height.value)

        if (props.active === false) return

        const path = d3.line()
            .context(actx)
            .x(d => d[0])
            .y(d => d[1])

        actx.globalAlpha = 1
        actx.lineWidth = 2

        anno.value.forEach(a => {
            if (selectedAnnos.value[a.id]) {
                // draw links that connect annotations labels and polygons
                actx.strokeStyle = a.color ? a.color : "black"
                const coords = getAnnotationPos(a.id)
                const off = 0.5 * (annoPos.value[a.id].side === "left" ? annoMeta.sizeL : annoMeta.sizeR)
                a.centroid.forEach(c => {
                    actx.beginPath()
                    path([c, [coords[0], coords[1]+off]])
                    actx.stroke()
                })
            }
        })

        const scale = d3.scaleLinear()
            .domain([1, Math.max(2, d3.max(graph.links, d => d.value))])
            .range([1, 10])

        actx.strokeStyle = "black"
        actx.globalAlpha = 0.25
        // draw links that connect annotations
        graph.links.forEach(d => {
            actx.lineWidth = scale(d.value)
            actx.beginPath()
            path(d.coords)
            actx.stroke()
        })
    }

    function calcLabelPositions() {
        const data = DM.getAnnotations().map(d => Object.assign({}, d))

        if (data.length > 0) {
            // default size
            const h = 20
            let pos, annoPosData = {}

            // get annotations on the left side
            const onLeft = data.filter(d => d.x <= targetRect.width*0.5)
            onLeft.sort((a, b) => a.y - b.y)

            let numL = Math.floor(targetRect.height / h)
            let sizeL = Math.floor(targetRect.height / numL)
            if (onLeft.length > 0 && Math.floor(targetRect.height / onLeft.length) > sizeL) {
                numL = onLeft.length
                sizeL = Math.floor(targetRect.height / numL)
            }

            const takenL = new Set()
            onLeft.forEach(a => {
                let minD = Number.MAX_VALUE
                // then check left and right
                for (let i = 0; i < numL; ++i) {
                    // distance to position
                    if (!takenL.has(i)) {
                        const dist = euclidean(a.x, a.y, 0, (i+0.5)*sizeL)
                        if (dist < minD) {
                            minD = dist
                            pos = i;
                        }
                    }
                }
                takenL.add(pos)
                annoPosData[a.id] = { index: pos, side: "left" }
            })

            // get annotations on the right side
            const onRight = data.filter(d => d.x > targetRect.width*0.5)
            onRight.sort((a, b) => a.y - b.y)

            let numR = Math.floor(targetRect.height / h)
            let sizeR = Math.floor(targetRect.height / numR)
            if (onRight.length > 0 && Math.floor(targetRect.height / onRight.length) > sizeR) {
                numR = onRight.length
                sizeR = Math.floor(targetRect.height / numR)
            }

            const takenR = new Set()
            onRight.forEach(a => {
                let minD = Number.MAX_VALUE
                // then check left and right
                for (let i = 0; i < numR; ++i) {
                    // distance to position
                    if (!takenR.has(i)) {
                        const dist = euclidean(a.x, a.y, targetRect.width, (i+0.5)*sizeR)
                        if (dist < minD) {
                            minD = dist
                            pos = i;
                        }
                    }
                }
                takenR.add(pos)
                annoPosData[a.id] = { index: pos, side: "right" }
            })

            annoMeta.sizeL = sizeL
            annoMeta.sizeR = sizeR
            annoPos.value = annoPosData
            annoLeft.value = onLeft
            annoRight.value = onRight
        } else {
            annoPos.value = []
            annoLeft.value = []
            annoRight.value = []
        }

        anno.value = data
    }

    function annotate(id, index) {
        DM.addToAnnotation(
            id,
            app.activeLens,
            app.columnIndex,
            app.refMode,
            app.lensType,
            controls.getColor(index)
        )
    }

    function update() {
        getCoordinates()
        annoFontSize = d3.scaleQuantile(anno.value.map(d => d.columns.map(c => c.count)).flat())
            .range([16, 14, 12, 10, 8])
        drawLinks()
    }
    function init() {
        getCoordinates()
        calcLabelPositions()
        const { nodes, links } = DM.getAnnotationConnections()
        graph.nodes = nodes
        graph.links = links
        graph.links.forEach(d => {
            const s = graph.nodes.find(n => n.id === d.source)
            const t = graph.nodes.find(n => n.id === d.target)
            d.coords = [[s.x, s.y], [t.x, t.y]]
        })
        annoFontSize = d3.scaleQuantile(anno.value.map(d => d.columns.map(c => c.count)).flat())
            .range([16, 14, 12, 10, 8])
        drawLinks()
    }

    onMounted(init)

    watch(() => ([props.targetId, props.time]), init, { deep: true })
    watch(wSize.width, getCoordinates)
    watch(wSize.height, getCoordinates)
    watch(scroll.y, update)
    watch(() => props.active, drawLinks)
    watch(selectedAnnos, drawLinks)

</script>

<style scoped>
.overlay {
    position: absolute;
    z-index: 100;
}
.anno-container:not(:hover) .del-anno,
.anno-container:not(:hover) .add-anno {
    visibility: hidden;
}
</style>