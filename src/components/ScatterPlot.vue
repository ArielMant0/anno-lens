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
    import { getAttr } from '@/use/util'

    const props = defineProps({
        data: {
            type: Array,
            required: true
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
        searchRadius: {
            type: Number,
            default: 20,
        },
        fixedLens: {
            type: Boolean,
            default: false
        },
    })

    const emit = defineEmits(["move", "hover", "click", "right-click"])

    const el = ref(null)
    const overlay = ref(null)

    let tree;
    let ctx;
    let x, y, colors, opacities;
    let lensX = props.width * 0.5, lensY = props.height * 0.5;

    const getX = d => getAttr(d, props.xAttr)
    const getY = d => getAttr(d, props.yAttr)
    const getC = d => props.colorAttr ? getAttr(d, props.colorAttr) : "darkgreen"
    const getO = d => props.opacityAttr ? getAttr(d, props.opacityAttr) : 1
    const getColor = d => colors ? colors(getC(d)) : "darkgreen"
    const getOpacity = d => opacities ? opacities(getO(d)) : 1

    function draw() {
        ctx.clearRect(0, 0, props.width, props.height)
        props.data.forEach(d => {
            ctx.globalAlpha = getOpacity(d)
            ctx.beginPath()
            const c = getColor(d)
            ctx.fillStyle = c
            ctx.strokeStyle =  c ? d3.color(c).darker() : "black"
            ctx.arc(x(getX(d)), y(getY(d)), props.radius, 0, Math.PI*2)
            ctx.fill()
            ctx.stroke()
        })
    }

    function findInCirlce(px, py, r) {
        const result = [], radius2 = r * r
        tree.visit(function(node, x1, y1, x2, y2) {
            if (node.length) {
                return x1 >= px + r || y1 >= py + r || x2 < px - r || y2 < py - r;
            }

            const dx = +tree._x.call(null, node.data) - px,
                dy = +tree._y.call(null, node.data) - py;

            if (dx * dx + dy * dy < radius2) {
                do { result.push(node.data.id); } while (node = node.next);
            }
        });

        return result;
    }

    function drawLens() {
        const svg = d3.select(overlay.value)

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
    }

    function getLensData(mx, my) {
        const res = []
        // let prev = new Set()
        for (let i = 1; i <= props.numLens; ++i) {
            const ids = findInCirlce(mx, my, props.searchRadius*i)
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
                case DATA_TYPES.ORDINAL:
                    scale = d3.scaleOrdinal(d3.schemeCategory10)
                    vals = Array.from(new Set(props.data.map(getC)).values())
                    vals.sort()
                    break;
                case DATA_TYPES.SEQUENTIAL:
                    scale = d3.scaleSequential(d3.interpolateTurbo)
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

        drawLens()
    }

    onMounted(init)

    watch(() => props.searchRadius, updateLens)
    watch(() => ([props.showLens, props.activeLens, props.numLens]), drawLens, { deep: true })
    watch(() => ([props.colorAttr, props.colorScale, props.colorType]), function() {
        makeColorScale()
        draw()
    }, { deep: true })
    watch(() => props.time, init)
    watch(() => props.update, function() {
        makeColorScale()
        draw()
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