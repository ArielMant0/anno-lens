<template>
    <div class="d-flex flex-column align-center">
        <v-select
            :model-value="dataset"
            density="compact"
            style="min-width: 300px;"
            label="Dataset"
            item-title="name"
            item-value="file"
            class="mt-2"
            hide-details
            hide-spin-buttons
            @update:model-value="v => app.setDataset(v)"
            :items="DATASETS"/>
        <MultiLensVis :dataset="dataset"/>
    </div>
</template>

<script setup>
    import MultiLensVis from '@/components/MultiLensVis.vue';
    import { storeToRefs } from 'pinia'
    import { DATASETS, useApp } from '@/stores/app';
    import { useControls } from '@/stores/controls';

    const app = useApp()
    const controls = useControls()

    const { dataset } = storeToRefs(app)

    window.addEventListener("keyup", (event) => controls.keyEvent(event))

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
