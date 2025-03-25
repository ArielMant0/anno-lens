<template>
    <main class="d-flex flex-column align-center">
        <div class="mt-2 mb-2">
            <v-select
                :model-value="dataset"
                density="compact"
                style="min-width: 300px;"
                label="Dataset"
                @update:model-value="v => app.setDataset(v)"
                :items="['heart_disease_uci', 'iris']"/>
        </div>
        <MultiLensVis :dataset="dataset"/>
    </main>
</template>

<script setup>
  import MultiLensVis from '@/components/MultiLensVis.vue';
  import { storeToRefs } from 'pinia'
  import { useApp } from '@/stores/app';

  const app = useApp()

  const { dataset } = storeToRefs(app)
</script>
