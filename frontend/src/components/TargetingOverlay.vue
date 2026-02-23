<template>
    <Teleport to="body">
        <div v-show="visible" id="targeting-overlay">
            <svg id="to-svg" style="position: absolute;" width="100%" height="100%"></svg>
        </div>
    </Teleport>
</template>

<script setup>
    import * as d3 from 'd3'
    import DM from '@/use/data-manager';
    import { useControls } from '@/stores/controls';
    import { ACTION_TARGET, ALL_ACTION_TARGETS } from '@/use/annotation/action-target';
    import { storeToRefs } from 'pinia';
    import { onMounted, watch } from 'vue';
import { LLMCommand } from '@/use/commands';

    const controls = useControls()
    const { canTarget, activeMappingId } = storeToRefs(controls)

    const visible = ref(false)

    function show() {
        console.debug("showing targeting overlay")
        if (!canTarget.value) return
        resetSelectable()
        visible.value = true

        updateMask()
    }

    function hide() {
        if (!visible.value) return
        controls.cancelActive()
        visible.value = false
        resetSelectable()
    }

    function resetSelectable() {
        document
            .querySelectorAll(ALL_ACTION_TARGETS.map(d => `*[data-target-type="${d}"]`))
            .forEach(el => el.classList.remove("valid-target"))
    }

    function onClick(element) {
        // get target type
        const targetType = element.getAttribute('data-target-type')
        const targetId = element.getAttribute('data-target-id').split(",")

        if (!targetType || !targetId) return

        switch (targetType) {
            case ACTION_TARGET.SELECTION:
                {
                    const annoId = element.getAttribute('data-target-anno')
                    // this is actually a selection in an annotation
                    if (annoId) {
                        const anno = DM.getAnnotationById(annoId)
                        controls.targetEvent(anno.selections, targetType, annoId)
                    } else {
                        controls.targetEvent(targetId.map(tid => DM.getSelectionById(tid)), targetType)
                    }
                }
                break
            case ACTION_TARGET.ANNOTATION:
                {
                    const anno = DM.getAnnotationById(targetId)
                    controls.targetEvent(anno, targetType, anno.id)
                }
                break
            case ACTION_TARGET.VIS:
                // TODO: what should happen here?
                controls.targetEvent(element, targetType)
                break
        }
    }

    function updateMask() {
        if (!visible.value) return;

        const cmd = controls.activeMapping.command
        if (!(cmd instanceof LLMCommand)) return

        // get selectors of available targets for the currently active mapping
        const selectors = cmd.targetTypes.map(d => `*[data-target-type="${d}"]`)
        const elements = Array.from(document.querySelectorAll(selectors))

        const svg = d3.select("#to-svg")

        svg.selectAll(".indicator").remove()

        svg.selectAll(".indicator")
            .data(elements.map(d => ({ el: d, rect: d.getBoundingClientRect() })))
            .join("rect")
            .classed("indicator valid-target rot-border", true)
            .attr("fill", "black")
            .attr("fill-opacity", 0.1)
            .attr("stroke", "black")
            .attr("stroke-dasharray", "4 4")
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("x", d => d.rect.left-2)
            .attr("y", d => d.rect.top-2)
            .attr("width", d => d.rect.width+4)
            .attr("height", d => d.rect.height+4)
            .on("pointerenter", function() {
                d3.select(this).attr("stroke", "magenta")
            })
            .on("pointerleave", function() {
                d3.select(this).attr("stroke", "black")
            })
            .on("click", function(_e, d) { onClick(d.el) })
    }

    function init() {
        window.addEventListener("resize", updateMask)
        // window.addEventListener("scroll", updateMask)
    }

    onMounted(init)

    watch(activeMappingId, function(value) {
        if (value !== null && !visible.value) {
            show()
        }
    })
    watch(canTarget, function(value) {
        if (value) {
            show()
        } else {
            hide()
        }
    })

</script>

<style>
#targeting-overlay {
    position: fixed;
    inset: 0;
    z-index: 4999;
    pointer-events: auto;
}
</style>