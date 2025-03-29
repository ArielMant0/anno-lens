<template>
    <svg ref="el" :width="width" :height="height"></svg>
</template>

<script setup>
    import * as d3 from 'd3'
    import { onMounted, watch } from 'vue';

    const props = defineProps({
        scale: {
            type: Function,
            required: true
        },
        selected: {
            type: Array,
            default: () => ([])
        },
        tickFormat: {
            type: Function,
            required: false
        },
        tickValues: {
            type: Function,
            required: false
        },
        numTicks: {
            type: Number,
            required: false
        },
        width: {
            type: Number,
            default: 100
        },
        height: {
            type: Number,
            default: 300
        },
    })

    const emit = defineEmits(["brush", "click"])

    const el = ref(null)

    let x, rects, brushG, brush, brushVals;

    function ramp(color, n=256) {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = n;
        const context = canvas.getContext("2d");
        for (let i = 0; i < n; ++i) {
            context.fillStyle = color(i / (n - 1));
            context.fillRect(0, i, 1, 1);
        }
        return canvas;
    }

    function draw() {

        const margin = 10, ticks = props.numTicks ? props.numTicks : props.height / 25;
        const w = Math.max(10, Math.floor(props.width * 0.25))

        const svg = d3.select(el.value)
        svg.selectAll("*").remove()

        let tickValues = props.tickValues

        // Sequential
        if (props.scale.interpolator) {
            x = Object.assign(props.scale.copy()
                .interpolator(d3.interpolateRound(margin, props.height - margin)),
                { range() { return [margin, props.height - margin]; } });

            const tmp = d3.scaleLinear()
                .domain([margin, props.height - margin])
                .range(x.domain())

            brush = d3.brushY()
                .extent([[margin, margin], [margin+w, props.height-margin]])
                .on("brush", function({ selection, sourceEvent }) {
                    if (sourceEvent) {
                        const vals = selection ? selection.map(d => tmp(d)) : null
                        vals.sort()
                        brushVals = vals.slice()
                        emit("brush", vals)
                    }
                })
                .on("end", function({ selection, sourceEvent }) {
                    if (selection || !sourceEvent) return
                    emit("brush", null)
                })


            svg.append("image")
                .attr("x", margin)
                .attr("y", margin)
                .attr("width", w)
                .attr("height", props.height - margin * 2)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(props.scale.interpolator()).toDataURL())

            brushG = svg.append("g").call(brush)

            // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
            if (!x.ticks) {
                const n = Math.round(ticks + 1);
                tickValues = d3.range(n).map(i => d3.quantile(props.scale.domain(), i / (n - 1)));
            }

        } else {
            x = d3.scaleBand()
                .domain(props.scale.domain())
                .rangeRound([props.height - margin, margin])
                .paddingInner(0.05)

            rects = svg.append("g")
                .selectAll("rect")
                .data(props.scale.domain())
                .join("rect")
                    .attr("x", margin)
                    .attr("y", x)
                    .attr("height", Math.max(0, x.bandwidth() - 1))
                    .attr("width", w)
                    .attr("fill", props.scale)
                    .style("cursor", "pointer")
                    .on("pointerenter", function() { d3.select(this).style("filter", "saturate(3)") })
                    .on("pointerleave", function() { d3.select(this).style("filter", null) })
                    .on("click", function(_e, d) { emit("click", d) })

        }

        svg.append("g")
            .attr("transform", `translate(${w + margin})`)
            .call(d3.axisRight(x).ticks(ticks).tickValues(tickValues).tickFormat(props.tickFormat))
            .call(g => g.select(".domain").remove())

        highlight()
    }

    function highlight() {
        const v = props.selected
        if (props.scale.interpolator) {
            if (v && v.length > 0) {
                if (!brushVals || brushVals[0] !== v[0] || brushVals[1] !== v[1]) {
                    brushVals = v.slice()
                    brushG.call(brush.move, v.map(x));
                }
            } else {
                brushVals = null
                brushG.call(brush.move, null);
            }
        } else {
            rects.attr("stroke", d => v && v.includes(d) ? "black" : null)
        }
    }

    onMounted(draw)

    watch(() => props.selected, highlight)
</script>