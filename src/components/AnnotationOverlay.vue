<template>
    <div>
        <Teleport to="body">
            <v-sheet v-for="a in anno"
                elevation="2"
                rounded="sm"
                class="pa-1 overlay text-caption"
                :style="{
                    left: (offsetX + a.x - 10)+'px',
                    top: (offsetY + a.y - 15)+'px',
                    pointerEvents: active ? 'all' : 'none',
                    opacity: active || isSelected(a) ? 1 : 0.25,
                    border: '1px solid ' + (isSelected(a) ? 'blue' : 'black')
                }">

                <div v-if="open">
                    <div v-for="c in a.columns">{{ c.name }}</div>
                </div>
                <div v-else>{{ a.columns.length }}</div>

            </v-sheet>
        </Teleport>

        <Teleport to="body">
            <svg v-if="lenses.length > 0"
                :width="width"
                :height="height"
                class="overlay"
                :style="{
                    left: offsetX+'px',
                    top: offsetY+'px',
                    pointerEvents: 'none',
                }">
                <g v-for="l in lenses" font-size="10" :transform="'translate('+l.x+','+l.y+')'">
                    <circle
                        :r="l.radius"
                        stroke="blue"
                        stroke-width="2"
                        stroke-dasharray="4 2"
                        fill="none">
                    </circle>

                    <text
                        dy="5"
                        text-anchor="middle"
                        fill="blue"
                        stroke="white"
                        stroke-width="3"
                        paint-order="stroke"
                        >{{ l.columns[0].name }}</text>
                </g>
            </svg>
        </Teleport>
    </div>
</template>

<script setup>
    import { useTooltip } from '@/stores/tooltip';
    import DM from '@/use/data-manager';
    import { useMouse, useWindowSize } from '@vueuse/core';
    import { computed, onMounted, watch } from 'vue';

    const tt = useTooltip()
    const mouse = useMouse()

    const props = defineProps({
        targetId: {
            type: String,
            required: true
        },
        active: {
            type: Boolean,
            required: true
        },
        time: {
            type: Number,
            default: 0
        },
        selected: {
            type: String,
            default: ""
        },
        tolerance: {
            type: Number,
            default: 50
        },
    })

    const offsetX = ref(0)
    const offsetY = ref(0)
    const width = ref(0)
    const height = ref(0)

    const anno = ref([])
    const open = ref(false)

    const wSize = useWindowSize()

    const lensesClose = computed(() => {
        return anno.value.filter(d => {
            const dx = Math.abs(mouse.x.value - (offsetX.value + d.x))
            const dy = Math.abs(mouse.y.value - (offsetY.value + d.y))
            return dx < props.tolerance && dy < props.tolerance
        })
    })
    const lenses = computed(() => {
        const ids = new Set(lensesClose.value.map(d => d.id))
        return lensesClose.value.concat(anno.value.filter(a => !ids.has(a.id) && isSelected(a)))
    })
    const hoverName = computed(() => {
        if (lensesClose.value.length === 0) {
            return ""
        }
        return lensesClose.value[0].columns[0].name
    })

    function getCoordinates() {
        const target = document.querySelector("#"+props.targetId)
        if (!target) return
        const rect = target.getBoundingClientRect()
        offsetX.value = rect.left
        offsetY.value = rect.top
        width.value = rect.width
        height.value = rect.height
    }

    function isSelected(annotation) {
        return annotation.columns.some(c => isSelectedColumn(c.name))
    }
    function isSelectedColumn(name) {
        return props.selected === name || hoverName.value === name
    }

    function update() {
        getCoordinates()
        anno.value = DM.getAnnotations()
    }

    onMounted(update)

    watch(() => ([props.targetId, props.time]), update, { deep: true })
    watch(() => wSize.width, getCoordinates)
    watch(() => wSize.height, getCoordinates)

</script>

<style scoped>
.overlay {
    position: absolute;
}
</style>