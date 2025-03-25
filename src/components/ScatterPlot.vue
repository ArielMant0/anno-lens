<template>
    <div style="position: relative; border: 1px solid grey;">
        <canvas ref="el" :width="width" :height="height" @pointermove="onMove" @click="onClick" @pointerleave="onMove"></canvas>
        <svg ref="overlay" class="overlay" :width="width" :height="height"></svg>
    </div>
</template>

<script setup>
    import * as d3 from 'd3'

    const props = defineProps({
        data: {
            type: Array,
            required: true
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
        radius: {
            type: Number,
            default: 4
        },
        showLens: {
            type: Boolean,
            default: false
        },
    })

    const emit = defineEmits(["move", "hover", "click", "right-click"])

    const el = ref(null)
    const overlay = ref(null)
    const searchRadius = ref(25)

    let tree;
    let ctx;
    let x, y, colors;
    let xUnit, yUnit;

    const getX = d => d[props.xAttr]
    const getY = d => d[props.yAttr]
    const getC = d => props.colorAttr ? d[props.colorAttr] : "darkgreen"
    const getColor = d => colors ? colors(getC(d)) : "darkgreen"


    function draw() {
        if (!ctx) ctx = el.value.getContext("2d")

        if (props.colorAttr) {
            const cvals = Array.from(new Set(props.data.map(getC)).values())
            cvals.sort()
            colors = d3.scaleOrdinal(d3.schemeCategory10).domain(cvals)
        } else {
            colors = null;
        }

        ctx.clearRect(0, 0, props.width, props.height)
        props.data.forEach(d => {
            ctx.beginPath()
            const c = getColor(d)
            ctx.fillStyle = c
            ctx.strokeStyle = d3.color(c).darker()
            ctx.arc(x(getX(d)), y(getY(d)), props.radius, 0, Math.PI*2)
            ctx.fill()
            ctx.stroke()
        })
    }

    function findInCirlce(px, py, r, filter) {
        const result = [],
            radius2 = r * r,
            accept = filter ?
                d => filter(d) && result.push(d) :
                d => result.push(d);

        tree.visit(function(node, x1, y1, x2, y2) {
            if (node.length) {
                return x1 >= px + r || y1 >= py + r || x2 < px - r || y2 < py - r;
            }

            const dx = +tree._x.call(null, node.data) - px,
                dy = +tree._y.call(null, node.data) - py;

            if (dx * dx + dy * dy < radius2) {
                do { accept(node.data); } while (node = node.next);
            }
        });

        return result;
    }

    function drawLens(px, py) {
        const svg = d3.select(overlay.value)
        svg.selectAll(".lens")
            .data([[px, py]])
            .join("circle")
            .classed("lens", true)
            .attr("cx", d => d[0])
            .attr("cy", d => d[1])
            .attr("r", searchRadius.value)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
    }

    function onMove(event) {
        const [mx, my] = d3.pointer(event, el.value)
        const res = findInCirlce(mx, my, searchRadius.value)
        emit("hover", makeCoords(res), event, res)
        if (props.showLens) {
            drawLens(mx, my)
        }
    }
    function onClick(event) {
        const [mx, my] = d3.pointer(event, el.value)
        const res = findInCirlce(mx, my, searchRadius.value)
        if (res.length > 0) {
            emit("click", makeCoords(res), event, res)
        }
    }

    function makeCoords(data) {
        return data.map(d => ([xUnit(getX(d)), yUnit(getY(d))]))
    }

    function init() {
        const off = props.radius + 2

        x = d3.scaleLinear()
            .domain(d3.extent(props.data, getX))
            .range([off, props.width - off])

        xUnit = x.copy().range([0, 1])

        y = d3.scaleLinear()
            .domain(d3.extent(props.data, getY))
            .range([props.height - off, off])

        yUnit = y.copy().range([1, 0])

        tree = d3.quadtree()
            .x(d => x(getX(d)))
            .y(d => y(getY(d)))
            .addAll(props.data)

        draw()
    }

    onMounted(init)

    watch(props, init, { deep: true })
</script>

<style scoped>
.overlay {
    position: absolute;
    pointer-events: none;
    top: 0;
    left: 0;
}
</style>