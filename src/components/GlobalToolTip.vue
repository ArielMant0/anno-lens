<template>
    <ToolTip :x="x" :y="y" :data="data" :align="align" :max-width="500"></ToolTip>
</template>

<script setup>
    import { useTooltip } from '@/stores/tooltip';
    import { storeToRefs } from 'pinia';
    import ToolTip from '@/components/ToolTip.vue';

    const tt = useTooltip();

    const { x, y, data, align } = storeToRefs(tt);

</script>

<style scoped>
.my-tooltip {
    position: absolute;
    z-index: 2999;
    max-width: 600px;
}
</style>