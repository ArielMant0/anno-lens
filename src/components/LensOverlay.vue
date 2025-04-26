<template>
    <Teleport to="body">
        <svg ref="el" class="overlay"
            :width="width"
            :height="height"
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
    import { onMounted, useTemplateRef, watch } from 'vue'
    import { deg2rad, getAttr, rad2deg } from '@/use/util'
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
        radius: {
            type: Number,
            required: true
        },
        drawMode: {
            type: String,
            default: "scatter"
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

    const el = useTemplateRef("el")

    let tx = 0, ty = 0, tw = 0, th = 0;

    const { width } = useWindowSize()
    const height = ref(100)

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
        height.value = rect.top + rect.height + 200
        tx = rect.left
        ty = rect.top
        tw = rect.width
        th = rect.height
        // draw lenses
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

        // draw additional vis
        switch(props.drawMode) {
            case "scatter":
                drawScatter(lenses)
                break
            case "chart":
                drawMicroVis(lenses)
                break
            default:
            case "labels":
                drawLabels(lenses)
        }
    }

    function drawScatter(lenses) {

        if (lenses.length === 0) return
        const svg = d3.select(el.value)

        const prim = lenses[0]
        const sec = lenses.length > 1 ? lenses[1] : null

        const getDegrees = (ax, ay, bx, by, r) => {
            const vx = ax - bx
            const vy = ay - by
            const norm = Math.sqrt(vx*vx + vy*vy)
            const nx = bx + (-vx / norm) * r
            const ny = by + (-vy / norm) * r
            const m = rad2deg(Math.atan2(ny-by, nx-bx))

            const onright = m <= 90 || m >= 270
            // debug: show vector lines
            if (false) {
                svg.append("line")
                    .attr("x1", ax)
                    .attr("y1", ay)
                    .attr("x2", bx)
                    .attr("y2", by)
                    .attr("stroke", "magenta")
                    .attr("stroke-width", 2)

                svg.append("line")
                    .attr("x1", nx)
                    .attr("y1", ny)
                    .attr("x2", bx)
                    .attr("y2", by)
                    .attr("stroke", "lime")
                    .attr("stroke-width", 2)
            }

            return [(360 + m + (onright ? -55 : 55)) % 360, (360 + m) % 360, (360 + m + (onright ? 55 : -55)) % 360]
        }

        const degrees = [
            sec !== null ?
                getDegrees(tx+sec.x, ty+sec.y, tx+prim.x, ty+prim.y, prim.radius).map(deg2rad) :
                [305, 0, 55].map(deg2rad),
            sec !== null ?
                getDegrees(tx+prim.x, ty+prim.y, tx+sec.x, ty+sec.y, sec.radius).map(deg2rad) :
                [],
        ]

        const drawScatterForLens = (l, radian) => {
            const ci = getColumnIndices(l)
            const ldata = ci
                .map(i => l.getResultColumn(props.mode, i))
                .filter(d => d !== null)

            if (!ldata || ldata.length === 0) return

            const dx = l.x + tx
            const dy = l.y + ty
            const r = l.radius + props.radius + 5

            // do not draw lens if the radius is too small
            if (props.radius < 10) return

            ldata.forEach((name, i) => {

                const deg = rad2deg(radian[i])
                const onright = deg <= 90 || deg >= 270
                const bot = deg >= 60 && deg <= 120, top = deg >= 240 && deg <= 300
                const topOrBot = top || bot

                const trigX = Math.cos(radian[i])
                const trigY = Math.sin(radian[i])
                const diffX = r * trigX
                const diffY = r * trigY

                const g = svg.append("g")
                    .attr("font-size", 12)

                g.append("circle")
                    .attr("cx", dx + diffX)
                    .attr("cy", dy + diffY)
                    .attr("r", props.radius)
                    .attr("fill", "white")
                    .attr("stroke", l.color ? l.color : "black")
                    .attr("stroke-width", name === props.selectedColumn ? 3 : 2)

                const scale = DM.scales[name]
                const points = l.getResultData()

                const sf = 1 - (props.radius / l.radius)

                g.append("g")
                    .selectAll("circle")
                    .data(points)
                    .join("circle")
                    .attr("cx", d => {
                        const px = DM.x(d.x)
                        return px + tx + diffX + (l.x - px) * sf
                    })
                    .attr("cy", d => {
                        const py = DM.y(d.y)
                        return py + ty + diffY + (l.y - py) * sf
                    })
                    .attr("r", 3)
                    .attr("fill", d => scale(getAttr(d, name)))
                    .attr("stroke", "black")

                g.append("text")
                    .attr("x", dx + diffX + (props.radius+5) * trigX)
                    .attr("y", dy + diffY + (props.radius+5) * trigY + (bot ? 8 : 0))
                    .attr("text-anchor", topOrBot ? "middle" : (onright ? "start" : "end"))
                    .attr("stroke", "white")
                    .attr("stroke-width", 3)
                    .attr("fill", "black")
                    .attr("paint-order", "stroke")
                    .attr("font-weight", name === props.selectedColumn ? "bold" : null)
                    .text(name)
            })
        }

        drawScatterForLens(prim, degrees[0])
        if (sec !== null) {
            drawScatterForLens(sec, degrees[1])
        }
    }

    function drawMicroVis(lenses) {
        const svg = d3.select(el.value)
        let prevRight = false;

        lenses.forEach(l => {

            const ci = getColumnIndices(l)
            const ldata = ci
                .map(i => l.getResultColumn(props.mode, i))
                .filter(d => d !== null)

            if (!ldata || ldata.length === 0) return

            const hists = ci.map(i => l.getResultHist(props.mode, i))

            const dx = l.x + tx
            const dy = l.y + ty
            const rw = Math.floor(props.radius * 2.5)
            const rh = Math.floor(rw * 0.5)
            const r = l.radius + 10

            const onright = !prevRight
            prevRight = onright

            const degrees = (onright ? [150, 90, 30] : [210, 270, 330]).map(deg2rad)

            ldata.forEach((name, i) => {

                const diffX = r * Math.sin(degrees[i])
                const diffY = r * Math.cos(degrees[i])

                const g = svg.append("g")
                    .attr("font-size", 12)

                const offX = dx + diffX + (onright ? 5 : -rw-5)
                const offY = dy + diffY - rh*0.5

                const sx = d3.scaleBand()
                    .domain(hists[i].map(d => d.x))
                    .range([0, rw])

                const sy = d3.scaleLinear()
                    .domain([0, 1])
                    .range([rh, 0])

                g.append("rect")
                    .attr("x", offX)
                    .attr("y", offY)
                    .attr("width", rw)
                    .attr("height", rh)
                    .attr("fill", "white")
                    .attr("stroke", "none")

                g.append("g")
                    .selectAll("rect")
                    .data(hists[i])
                    .join("rect")
                    .attr("x", d => offX + sx(d.x))
                    .attr("y", d => offY + sy(d.y))
                    .attr("width", sx.bandwidth())
                    .attr("height", d => sy(0) - sy(d.y))
                    .attr("fill", d => d.color)
                    .attr("stroke", "none")

                g.append("rect")
                    .attr("x", offX)
                    .attr("y", offY)
                    .attr("width", rw)
                    .attr("height", rh)
                    .attr("fill", "none")
                    .attr("stroke", l.color ? l.color : "black")
                    .attr("stroke-width", name === props.selectedColumn ? 2 : 1)

                // g.append("g")
                //     .attr("transform", `translate(0,${rh-15})`)
                //     .call(d3.axisBottom(sx))

                g.append("text")
                    .attr("x", dx+diffX + (onright ? rw+10: -rw-10))
                    .attr("y", dy+diffY+4)
                    .attr("text-anchor", onright ? "start" : "end")
                    .attr("stroke", "white")
                    .attr("stroke-width", 3)
                    .attr("fill", "black")
                    .attr("paint-order", "stroke")
                    .attr("font-weight", name === props.selectedColumn ? "bold" : null)
                    .text(name)
            })
        })
    }

    function drawLabels(lenses) {

        const svg = d3.select(el.value)
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
    position: fixed;
    top: 0;
    left: 0;
    z-index: 200;
}
</style>