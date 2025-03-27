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
        width: {
            type: Number,
            default: 100
        },
        height: {
            type: Number,
            default: 300
        }
    })

    const el = ref(null)

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
        let x;
        const margin = 10;
        const w = Math.max(10, Math.floor(props.width * 0.25))

        const svg = d3.select(el.value)
        svg.selectAll("*").remove()

        // Sequential
        if (props.scale.interpolator) {
            x = Object.assign(props.scale.copy()
                .interpolator(d3.interpolateRound(props.height - margin, margin)),
                {range() { return [props.height - margin, margin]; }});

            svg.append("image")
                .attr("x", margin)
                .attr("y", margin)
                .attr("width", w)
                .attr("height", props.height - margin * 2)
                .attr("preserveAspectRatio", "none")
                .attr("xlink:href", ramp(props.scale.interpolator()).toDataURL());
        } else {
            x = d3.scaleBand()
                .domain(props.scale.domain())
                .rangeRound([props.height - margin, margin]);

            svg.append("g")
                .selectAll("rect")
                .data(props.scale.domain())
                .join("rect")
                    .attr("x", margin)
                    .attr("y", x)
                    .attr("height", Math.max(0, x.bandwidth() - 1))
                    .attr("width", w)
                    .attr("fill", props.scale);
        }

        svg.append("g")
            .attr("transform", `translate(${w + margin})`)
            .call(d3.axisRight(x).ticks(Math.floor(props.height / 25)))
            .call(g => g.select(".domain").remove())
    }

    onMounted(draw)

    watch(props, draw)
</script>