<template>
    <Teleport to="body">
        <div v-show="visible" id="targeting-overlay" @click="onClick"></div>
    </Teleport>
</template>

<script setup>
    import DM from '@/use/data-manager';
    import { useControls } from '@/stores/controls';
    import { ACTION_TARGET, ALL_ACTION_TARGETS } from '@/use/annotation/action-target';
    import { storeToRefs } from 'pinia';
    import { onMounted, useTemplateRef, watch } from 'vue';

    const controls = useControls()
    const { canTarget, hasActive, activeMappingId } = storeToRefs(controls)

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

    function onClick(event) {
        const overlay = document.getElementById("targeting-overlay")
        overlay.style.pointerEvents = "none";
        const clicked = document.elementFromPoint(event.clientX, event.clientY);
        overlay.style.pointerEvents = "auto";

        if (clicked && clicked !== overlay) {
            // get target type
            const targetType = clicked.getAttribute('data-target-type')
            const targetId = clicked.getAttribute('data-target-id').split(",")

            if (!targetType || !targetId) return

            switch (targetType) {
                case ACTION_TARGET.DATA:
                    const annoId = clicked.getAttribute('data-target-anno')
                    // this is actually a selection in an annotation
                    if (annoId) {
                        const anno = DM.getAnnotationById(annoId)
                        controls.targetEvent(anno.selections, targetType)
                    } else {
                        controls.targetEvent(targetId.map(tid => DM.getSelectionById(tid)), targetType)
                    }
                    break
                case ACTION_TARGET.ANNOTATION:
                    const anno = DM.getAnnotationById(targetId)
                    controls.targetEvent(anno, targetType)
                    break
                case ACTION_TARGET.VIS:
                    // TODO: what should happen here?
                    controls.targetEvent(clicked, targetType)
                    break
            }
        }
    }

    function updateMask() {
        if (!visible.value) return;

        const overlay = document.getElementById("targeting-overlay")
        // get selectors of available targets for the currently active mapping
        const selectors = controls.activeMapping.targetTypes.map(d => `*[data-target-type="${d}"]`)
        const elements = document.querySelectorAll(selectors)

        const masks = []
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();

            if (rect.width * rect.height <= 0) {
                el.classList.remove("valid-target")
                return
            }

            el.classList.add("valid-target")

            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2

            const radius = Math.max(rect.width, rect.height) / 1.15

            masks.push(`radial-gradient(circle ${radius}px at ${cx}px ${cy}px, transparent 98%, black 100%)`)
            // return `linear-gradient(to right black ${rect.left}px, transparent ${rect.left}px, transparent ${rect.right}px, black ${rect.right}px)`;
        });

        if (masks.length === 0) {
            return hide()
        }

        const maskValue = masks.join(",");

        overlay.style.webkitMaskImage = maskValue;
        overlay.style.maskImage = maskValue;
        overlay.style.webkitMaskComposite = "destination-out";
        overlay.style.maskComposite = "exclude";
    }

    function init() {
        window.addEventListener("resize", updateMask)
        window.addEventListener("scroll", updateMask)
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
    transition: opacity 120ms ease-out;
    background: rgba(0,0,0,0.75);
    min-height: 100vh;
}
</style>