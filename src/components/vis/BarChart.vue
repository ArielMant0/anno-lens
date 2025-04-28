<template>
    <svg ref="el" :width="width" :height="height"></svg>
</template>

<script setup>
    import { getAttr } from '@/use/util';
    import * as d3 from 'd3'
    import { onMounted } from 'vue';

    const props = defineProps({
        data: {
            type: Array,
            required: true
        },
        selected: {
            type: Array,
            default: () => ([])
        },
        title: {
            type: String,
            required: false
        },
        width: {
            type: Number,
            default: 200
        },
        height: {
            type: Number,
            default: 100
        },
        xAttr: {
            type: String,
            default: "x"
        },
        yAttr: {
            type: String,
            default: "y"
        },
        yDomain: {
            type: Array,
            required: false
        },
        colorAttr: {
            type: String,
        },
        patternAttr: {
            type: String,
        },
        fillColor: {
            type: String,
            default: "darkgreen"
        },
        selectable: {
            type: Boolean,
            default: false
        }
    })

    const emit = defineEmits(["click", "right-click"])

    const el = ref(null)

    const getX = d => getAttr(d, props.xAttr)
    const getY = d => getAttr(d, props.yAttr)
    const getC = d => getAttr(d, props.colorAttr)
    const getP = d => getAttr(d, props.patternAttr)

    function draw() {
        const svg = d3.select(el.value)
        svg.selectAll("*").remove()

        const off = 25;

        const x = d3.scaleBand()
            .domain(Array.from(new Set(props.data.map(getX))))
            .range([5, props.width-5])
            .paddingInner(0.1)

        const y = d3.scaleLinear()
            .domain(props.yDomain ? props.yDomain : [0, d3.max(props.data, getY)])
            .range([props.height-5-off, 5])

        const set = new Set(props.selected)

        if (props.patternAttr) {
            const p = svg.append("mask")
                .attr("id", "diagl")
                .attr("maskUnits", "userSpaceOnUse")

            const xs = x.bandwidth()
            const ys = (props.height-5-off) / 10

            p.selectAll("path")
                .data(d3.range(10))
                .join("path")
                // .attr("transform", "rotate(125)")
                .attr("fill", "none")
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .attr("d", d => `M5 ${5 + (d+1)*ys} h${xs}z`)
        }

        svg.append("g")
            .selectAll("rect")
            .data(props.data)
            .join("rect")
            .attr("x", d => x(getX(d)))
            .attr("y", d => y(getY(d)))
            .attr("width", x.bandwidth())
            .attr("height", d => y(0) - y(getY(d)))
            .attr("fill", d => {
                const col = props.colorAttr ? getC(d) : props.fillColor
                if (props.patternAttr && getP(d)) {
                    return d3.color(col).brighter(1)
                }
                return col
            })
            .attr("mask", d => props.patternAttr && getP(d) ? "url(#diagl)" : null)
            .attr("opacity", d => set.size > 0 && !set.has(d.x) ? 0.5 : 1)
            .style("cursor", props.selectable ? "pointer" : null)
            .on("click", (_event, d) => {
                emit("click", d)
            })
            .on("contextmenu", (event, d) => {
                event.preventDefault()
                emit("right-click", d)
            })

        svg.append("g")
            .attr("transform", `translate(0,${props.height-off})`)
            .call(d3.axisBottom(x))
            .selectAll(".tick text")
            .text(d => {
                const t = (""+d).replaceAll("_", " ")
                return t.length*5 > x.bandwidth() ? t.slice(0, Math.floor(x.bandwidth() / 5))+'..' : t
            })
            .style("cursor", props.selectable ? "pointer" : null)
            .on("click", (_event, d) => {
                emit("click", { x: d, y: 0 })
            })
            .on("contextmenu", (event, d) => {
                event.preventDefault()
                emit("right-click", { x: d, y: 0 })
            })
    }

    onMounted(draw)

    watch(props, draw, { deep: true })
</script>