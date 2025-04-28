<template>
    <div style="height: 99vh;" class="pa-2">
        <div style="width: 100%;" class="d-flex justify-center">
            <v-select
                :model-value="dataset"
                density="compact"
                style="max-width: 300px;"
                label="Dataset"
                item-title="name"
                item-value="file"
                hide-details
                hide-spin-buttons
                hide-no-data
                @update:model-value="v => app.setDataset(v)"
                :items="DATASETS"/>
        </div>
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
