<template>
    <div style="height: 100vh;" class="pa-2">
        <MultiLensVis/>
    </div>
</template>

<script setup>
    import MultiLensVis from '@/components/MultiLensVis.vue';
    import { useControls } from '@/stores/controls';
    import { onMounted } from 'vue';

    const controls = useControls()

    onMounted(function() {
        window.addEventListener("keydown", (event) => controls.keyEvent(event))
    })

</script>

<style>
.text-dots {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.hover-italic:hover {
    font-style: italic;
}
.hover-bold:hover {
    font-weight: bold;
}
</style>
