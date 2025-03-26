<template>
    <svg ref="el" :width="width" :height="height"></svg>
</template>

<script setup>
    import * as d3 from 'd3'
    import { onMounted } from 'vue';

    const props = defineProps({
        data: {
            type: Array,
            required: true
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
        colorAttr: {
            type: String,
        },
        fillColor: {
            type: String,
            default: "darkgreen"
        },
    })

    const el = ref(null)

    const getX = d => d[props.xAttr]
    const getY = d => d[props.yAttr]
    const getC = d => d[props.colorAttr]

    function draw() {
        const svg = d3.select(el.value)
        svg.selectAll("*").remove()

        const off = 25;

        const x = d3.scaleBand()
            .domain(Array.from(new Set(props.data.map(getX))))
            .range([5, props.width-5])
            .paddingInner(0.1)

        const y = d3.scaleLinear()
            .domain([0, d3.max(props.data, getY)])
            .range([props.height-5-off, 5])

        svg.append("g")
            .selectAll("rect")
            .data(props.data)
            .join("rect")
            .attr("x", d => x(getX(d)))
            .attr("y", d => y(getY(d)))
            .attr("width", x.bandwidth())
            .attr("height", d => y(0) - y(getY(d)))
            .attr("fill", d => props.colorAttr ? getC(d) : props.fillColor)

        svg.append("g")
            .attr("transform", `translate(0,${props.height-off})`)
            .call(d3.axisBottom(x))
    }

    onMounted(draw)

    watch(props, draw, { deep: true })
</script>