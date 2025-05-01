<template>
    <div style="width: min-content; position: absolute; top: 10px; left: 15px; z-index: 200" class="d-flex align-start">
        <v-btn
            class="mr-3"
            density="comfortable"
            variant="flat"
            color="primary"
            :icon="open ? 'mdi-chevron-double-left' : 'mdi-chevron-double-right'"
            @click="open = !open"/>

        <v-select v-if="open"
            :model-value="dataset"
            density="compact"
            style="min-width: 200px; font-size: small;"
            label="Dataset"
            item-title="name"
            item-value="file"
            hide-details
            hide-spin-buttons
            hide-no-data
            @update:model-value="v => app.setDataset(v)"
            :items="DATASETS"/>

    </div>
</template>

<script setup>
    import { useApp, DATASETS } from '@/stores/app';
    import { storeToRefs } from 'pinia';

    const app = useApp()

    const { dataset } = storeToRefs(app)

    const open = ref(false)
</script>