<template>
    <div style="position: relative; border: 1px solid grey;">
        <canvas ref="el" class="scatter" :width="width" :height="height" @pointermove="onMove" @click="onClick" @pointerleave="onMove"></canvas>
        <svg ref="overlay" class="overlay" :width="width" :height="height"></svg>
    </div>
</template>

<script setup>
    import * as d3 from 'd3'
    import { DATA_TYPES } from '@/stores/app'
    import { watch } from 'vue'
    import { deg2rad, findInCircle, getAttr } from '@/use/util'

    const props = defineProps({
        data: {
            type: Array,
            required: true
        },
        selected: {
            type: Array,
            default: () => ([])
        },
        time: {
            type: Number,
            required: false
        },
        update: {
            type: Number,
            required: false
        },
        width: {
            type: Number,
            default: 500
        },
        height: {
            type: Number,
            default: 500
        },
        xAttr: {
            type: String,
            default: "x"
        },
        yAttr: {
            type: String,
            default: "y"
        },
        colorAttr: {
            type: String,
            required: false
        },
        opacityAttr: {
            type: String,
            required: false
        },
        colorType: {
            type: Number,
            default: 1
        },
        colorScale: {
            type: Function
        },
        radius: {
            type: Number,
            default: 4
        },
        showLens: {
            type: Boolean,
            default: false
        },
        numLens: {
            type: Number,
            default: 1,
        },
        activeLens: {
            type: Number,
            default: 0,
        },
        lensLabels: {
            type: Array,
            default: () => ([]),
        },
        activeLensLabel: {
            type: String,
            default: "",
        },
        searchRadius: {
            type: Number,
            default: 20,
        },
        fixedLens: {
            type: Boolean,
            default: false
        },
        highlightColor: {
            type: String,
            default: "blue"
        }
    })

    const emit = defineEmits(["move", "hover", "click", "right-click"])

    const el = ref(null)
    const overlay = ref(null)

    let tree;
    let ctx;
    let x, y, colors, opacities;
    let lensX = props.width * 0.5, lensY = props.height * 0.5;

    let dataIds = new Set()

    const getX = d => getAttr(d, props.xAttr)
    const getY = d => getAttr(d, props.yAttr)
    const getC = d => props.colorAttr ? getAttr(d, props.colorAttr) : "darkgreen"
    const getO = d => props.opacityAttr ? getAttr(d, props.opacityAttr) : 1
    const getColor = d => colors ? colors(getC(d)) : "darkgreen"
    const getOpacity = d => opacities ? opacities(getO(d)) : 1

    function draw() {
        ctx.clearRect(0, 0, props.width, props.height)
        props.data.forEach(d => {
            if (dataIds.size > 0 && !dataIds.has(d.id)) return
            ctx.globalAlpha = getOpacity(d)
            ctx.beginPath()
            const c = getColor(d)
            ctx.fillStyle = c
            ctx.strokeStyle =  c ? d3.color(c).darker() : "black"
            ctx.arc(x(getX(d)), y(getY(d)), props.radius, 0, Math.PI*2)
            ctx.fill()
            ctx.stroke()
        })
        drawLens()
    }

    function drawLens() {
        const svg = d3.select(overlay.value)
        svg.selectAll("*").remove()

        svg.selectAll(".lens")
            .data(props.showLens ? d3.range(0, props.numLens) : [])
            .join("path")
            .classed("lens", true)
            .attr("transform", `translate(${lensX},${lensY})`)
            .attr("d", d => d3.arc()({
                innerRadius: 0,
                outerRadius: props.searchRadius * (d + 1),
                startAngle: 0,
                endAngle: Math.PI * 2
            }) )
            .attr("fill", d => d === props.activeLens ? "grey" : "none")
            .attr("fill-opacity", 0.25)
            .attr("stroke", "black")
            .attr("stroke-width", 2)

        const degrees = [135, 90, 45].map(deg2rad)
        const r = props.searchRadius + 5
        const dx = lensX
        const dy = lensY

        const g = svg.selectAll(".lens-label")
            .data(props.showLens ?
                props.lensLabels.map(d => ({
                    id: d,
                    text: d.length >= 15 ? d.slice(0, 15)+'..' : d
                })) :
                []
            )
            .join("g")
            .classed("lens-label", true)
            .attr("font-size", 12)
            .attr("transform", (_, i) => `translate(${dx + r * Math.sin(degrees[i])},${dy + r * Math.cos(degrees[i])})`)

        g.append("rect")
            .attr("x", 0)
            .attr("y", -10)
            .attr("width", d => d.text.length * 6 + 5)
            .attr("height", 20)
            .attr("fill", d => d.id === props.activeLensLabel ? props.highlightColor : "white")
            .attr("fill-opacity", 0.5)
            .attr("stroke", "black")

        g.append("text")
            .attr("x", 5)
            .attr("y", 4)
            .attr("text-anchor", "start")
            .attr("stroke", "white")
            .attr("stroke-width", 3)
            .attr("fill", "black")
            .attr("paint-order", "stroke")
            .text(d => d.text)
    }

    function getLensData(mx, my) {
        const res = []
        // let prev = new Set()
        for (let i = 1; i <= props.numLens; ++i) {
            const ids = findInCircle(tree, mx, my, props.searchRadius*i).map(d => d.id)
            res.push(ids)
            // res.push(ids.filter(id => !prev.has(id)))
            // prev = new Set(ids)
        }
        return res
    }

    function updateLens() {
        emit("hover", getLensData(lensX, lensY), lensX, lensY)
        if (props.showLens) {
            drawLens()
        }
    }

    function onMove(event) {
        if (props.fixedLens) return
        const [mx, my] = d3.pointer(event, el.value)
        emit("hover", getLensData(mx, my), mx, my)
        lensX = mx;
        lensY = my
        drawLens()
    }
    function onClick(event) {
        const [mx, my] = d3.pointer(event, el.value)
        const res = getLensData(mx, my)
        emit("click", res, mx, my)
        lensX = mx;
        lensY = my
        drawLens()
    }

    function makeColorScale() {
        if (props.colorScale !== undefined) {
            colors = props.colorScale
        } else if (props.colorAttr) {
            let scale, vals;
            switch (props.colorType) {
                default:
                case DATA_TYPES.BOOLEAN:
                case DATA_TYPES.NOMINAL:
                    scale = d3.scaleOrdinal(d3.schemeCategory10).unknown("black")
                    vals = Array.from(new Set(props.data.map(getC)).values())
                    vals.sort((a, b) => a-b)
                    break
                case DATA_TYPES.ORDINAL:
                    scale = d3.scaleOrdinal(d3.schemeBlues[9]).unknown("black")
                    vals = Array.from(new Set(props.data.map(getC)).values())
                    vals.sort((a, b) => a-b)
                    break;
                case DATA_TYPES.SEQUENTIAL:
                    scale = d3.scaleSequential(d3.interpolatePlasma).unknown("black")
                    vals = d3.extent(props.data, getC)
                    break;
            }
            colors = scale.domain(vals)
        } else {
            colors = null;
        }

        if (props.opacityAttr) {
            opacities = d3.scaleLinear()
                .domain(d3.extent(props.data, getO))
                .range([0.01, 1])
        } else {
            opacities = null
        }
    }

    function updateSelected() {
        dataIds = new Set(props.selected)
        draw()
    }

    function init() {
        const off = props.radius + 2

        x = d3.scaleLinear()
            .domain(d3.extent(props.data, getX))
            .range([off, props.width - off])

        y = d3.scaleLinear()
            .domain(d3.extent(props.data, getY))
            .range([props.height - off, off])

        tree = d3.quadtree()
            .x(d => x(getX(d)))
            .y(d => y(getY(d)))
            .addAll(props.data)

        ctx = ctx ? ctx : el.value.getContext("2d")

        makeColorScale()

        draw()

        updateSelected()
    }

    onMounted(init)

    watch(() => props.searchRadius, updateLens)
    watch(() => ([props.showLens, props.activeLens, props.numLens, props.lensLabels]), drawLens, { deep: true })
    watch(() => ([props.colorAttr, props.colorScale, props.colorType]), function() {
        makeColorScale()
        updateSelected()
    }, { deep: true })

    watch(() => props.selected, updateSelected)
    watch(() => props.time, init)
    watch(() => props.update, function() {
        makeColorScale()
        updateSelected()
    })
</script>

<style scoped>
.overlay {
    position: absolute;
    pointer-events: none;
    top: 0;
    left: 0;
}
</style>