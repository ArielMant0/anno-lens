<template>
    <main class="d-flex flex-column align-center">
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
    </main>
</template>

<script setup>
  import MultiLensVis from '@/components/MultiLensVis.vue';
  import { storeToRefs } from 'pinia'
  import { DATASETS, useApp } from '@/stores/app';

  const app = useApp()

  const { dataset } = storeToRefs(app)
</script>

<style>
.text-dots {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
</style>
