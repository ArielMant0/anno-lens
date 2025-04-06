<template>
    <Teleport to="body">
        <svg ref="el" class="overlay"
            :width="width" :height="height"
            :style="{
                pointerEvents: active ? 'painted' : 'none'
            }">
        </svg>
    </Teleport>
</template>

<script setup>
    import * as d3 from 'd3'
    import DM from '@/use/data-manager'
    import { useWindowScroll, useWindowSize } from '@vueuse/core'
    import { onMounted, watch } from 'vue'
    import { deg2rad } from '@/use/util'
    import { useTheme } from 'vuetify'

    const theme = useTheme()

    const active = defineModel()
    const props = defineProps({
        target: {
            type: String,
            required: true
        },
        indices: {
            type: Array,
            required: true
        },
        selectedColumn: {
            type: String,
            required: true
        },
        mode: {
            type: String,
            required: true
        },
        index: {
            type: Number,
            default: 0
        },
        size: {
            type: Number,
            default: 3
        },
        time: {
            type: Number,
            default: 0
        },
    })

    const el = ref(null)

    let tx = 0, ty = 0, tw = 0, th = 0;

    const { width, height } = useWindowSize()

    const scroll = useWindowScroll()

    function getColumnIndices(lens) {
        if (props.index <= 0) {
            return d3.range(0, Math.min(props.size, lens.numResults[props.mode]))
        }
        return d3.range(props.index-1, Math.min(props.index+props.size-1, lens.numResults[props.mode]))
    }

    function update() {
        const el = document.querySelector("#"+props.target)
        const rect = el.getBoundingClientRect()
        tx = rect.left
        ty = rect.top + scroll.y.value
        tw = rect.width
        th = rect.height
        draw()
    }

    function draw() {
        if (DM.lenses.length === 0) return
        const lenses = props.indices
            .map(i => DM.lenses[i])
            .filter(d => d.x !== null && d.y !== null)


        const svg = d3.select(el.value)
        svg.selectAll("*").remove()

        if (lenses.length === 0) return

        const lg = svg.append("g")
            .selectAll(".lens")
            .data(lenses)
            .join("g")
            .classed("lens", true)
            .attr("transform", d => `translate(${tx+d.x},${ty+d.y})`)

        lg.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", d => d.radius)
            .attr("stroke", d => d.color ? d.color : "black")
            .attr("fill", "none")
            .attr("stroke-width", 2)

        const prim = theme.current.value.colors.primary
        const sec = "grey"

        let prevRight = false;

        lenses.forEach(l => {

            const ci = getColumnIndices(l)

            const ldata = ci
                .map(i => l.getResultColumn(props.mode, i))
                .filter(d => d !== null)

            if (!ldata || ldata.length === 0) return


            const dx = l.x + tx
            const dy = l.y + ty
            const r = l.radius + 5

            const rw = 100
            const onright = !prevRight
            prevRight = onright

            const degrees = (onright ? [135, 90, 45] : [225, 270, 315]).map(deg2rad)

            const labels = svg.append("g")
                .selectAll(".label")
                .data(ldata)
                .join("g")
                .classed("label", true)
                .attr("font-size", 12)
                .attr("transform", (_d, i) => `translate(${dx + r * Math.sin(degrees[i])},${dy + r * Math.cos(degrees[i])})`)

            labels
                .append("rect")
                .attr("x", onright ? 5 : -rw-5)
                .attr("y", -10)
                .attr("width", rw)
                .attr("height", 20)
                .attr("fill", "none")
                .attr("stroke", "black")

            labels
                .append("rect")
                .attr("x", onright ? 5 : -rw-5)
                .attr("y", -10)
                .attr("width", (_d, i) => (rw + 5) * l.getResultValue(props.mode, ci[i]))
                .attr("height", 20)
                .attr("fill", d => d === props.selectedColumn ? prim : sec)
                .attr("fill-opacity", 0.5)
                .attr("stroke", "none")

            labels
                .append("text")
                .attr("x", onright ? 10 : -rw)
                .attr("y", 4)
                .attr("text-anchor", "start")
                .attr("stroke", "white")
                .attr("stroke-width", 3)
                .attr("fill", "black")
                .attr("paint-order", "stroke")
                .text(d => d)
        })
    }

    onMounted(update)

    watch(props, update)
    watch(width, update)
    watch(height, update)

    watch(scroll.y, update)

</script>

<style scoped>
.overlay {
    position: absolute;
    top: 0;
    left: 0;
}
</style>