<template>
    <div>
        <Teleport to="body">
            <canvas ref="annolinks"
                :width="width"
                :height="height"
                class="overlay"
                :style="{
                    left: offsetX+'px',
                    top: offsetY+'px',
                    pointerEvents: 'none',
                }">
            </canvas>
        </Teleport>

        <Teleport to="body">
            <div style="pointer-events: none;">
                <div v-for="a in anno"
                    class="overlay text-caption"
                    :style="{
                        textAlign: 'center',
                        left: (offsetX + a.x - (a.columns[0].name.length * 3.5))+'px',
                        top: (offsetY + a.y - 10)+'px',
                        opacity: 1,
                    }">
                    {{ a.columns[0].name }}
                    <span v-if="a.columns.length > 1" style="font-size: smaller;">
                        (+{{ a.columns.length-1 }})
                    </span>
                </div>
            </div>
        </Teleport>

        <Teleport to="body">
            <svg v-if="lenses.length > 0"
                :width="width"
                :height="height"
                class="overlay"
                :style="{
                    left: offsetX+'px',
                    top: offsetY+'px',
                    pointerEvents: 'none',
                }">
                <g v-for="l in lenses" :transform="'translate('+l.x+','+l.y+')'">
                    <circle
                        :r="l.radius"
                        stroke="blue"
                        stroke-width="2"
                        stroke-dasharray="4 2"
                        fill="none">
                    </circle>

                    <g>
                        <text v-for="(c, i) in l.columns"
                            :dy="5 + i * annoFontSize(c.count)"
                            text-anchor="middle"
                            fill="blue"
                            stroke="white"
                            stroke-width="3"
                            paint-order="stroke"
                            :font-size="annoFontSize(c.count)"
                            >{{ c.name }}</text>
                    </g>
                </g>
            </svg>
        </Teleport>
    </div>
</template>

<script setup>
    import * as d3 from 'd3'
    import DM from '@/use/data-manager';
    import { useMouse, useWindowScroll, useWindowSize } from '@vueuse/core';
    import { computed, onMounted, watch } from 'vue';

    const mouse = useMouse()

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
    })

    const scroll = useWindowScroll()

    const annolinks = ref(null)

    const offsetX = ref(0)
    const offsetY = ref(0)
    const width = ref(0)
    const height = ref(0)

    const anno = ref([])

    let actx, annoFontSize = () => 14

    const graph = {
        nodes: [],
        links: []
    }

    const wSize = useWindowSize()

    const lensesClose = computed(() => {
        return anno.value.filter(d => {
            const dx = Math.abs(mouse.x.value - (offsetX.value + d.x))
            const dy = Math.abs(mouse.y.value - (offsetY.value + d.y))
            return dx < props.tolerance && dy < props.tolerance
        })
    })
    const lenses = computed(() => {
        const ids = new Set(lensesClose.value.map(d => d.id))
        return lensesClose.value.concat(anno.value.filter(a => !ids.has(a.id) && isSelected(a)))
    })
    const hoverName = computed(() => {
        if (lensesClose.value.length === 0) {
            return ""
        }
        return lensesClose.value[0].columns[0].name
    })

    function getOffset(lens, index) {
        const before = lens.columns.reduce((acc, d, i) => acc + i < index ? annoFontSize(d.count) : 0, 0)
        const all = lens.columns.reduce((acc, d) => acc + annoFontSize(d.count), 0)
        console.log(index, before, all, lens.columns)
        return all < lens.radius ? before : before-lens.radius
    }

    function getCoordinates() {
        const target = document.querySelector("#"+props.targetId)
        if (!target) return
        const rect = target.getBoundingClientRect()
        offsetX.value = rect.left
        offsetY.value = rect.top + scroll.y.value
        width.value = rect.width
        height.value = rect.height
    }

    function isSelected(annotation) {
        return annotation.columns.some(c => isSelectedColumn(c.name))
    }
    function isSelectedColumn(name) {
        return props.selected === name || hoverName.value === name
    }

    function drawLinks() {
        actx = actx ? actx : annolinks.value.getContext("2d")

        actx.clearRect(0, 0, width.value, height.value)

        if (props.active === false) return

        const path = d3.line()
            .context(actx)
            .x(d => d[0])
            .y(d => d[1])

        actx.strokeStyle = "black"
        const scale = d3.scaleQuantile(graph.links.map(d => d.value), d3.range(1, 8))

        actx.globalAlpha = 0.25
        graph.links.forEach(d => {
            actx.lineWidth = scale(d.value)
            actx.beginPath()
            path(d.coords)
            actx.stroke()
        })
    }

    function update() {
        getCoordinates()
        annoFontSize = d3.scaleQuantile(anno.value.map(d => d.columns.map(c => c.count)).flat())
            .range([16, 14, 12, 10, 8])
        drawLinks()
    }
    function init() {
        getCoordinates()
        anno.value = DM.getAnnotations()
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

</script>

<style scoped>
.overlay {
    position: absolute;
}
</style>