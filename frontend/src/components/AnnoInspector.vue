<template>
    <v-sheet rounded elevation="2" min-height="100" style="width: 100%;">

        <div v-if="llmLoading" class="d-flex align-center justify-center">
            <v-progress-circular size="32" indeterminate></v-progress-circular>
        </div>

        <div v-for="anno in annos" :key="anno.id+'_'+anno.timeUpdated" class="pa-2">
            <div>
                <span style="font-weight: bold;">{{ anno.label }}</span> <span class="text-caption">({{ anno.data.size }}<v-icon size="small">mdi-scatter-plot</v-icon>)</span>
            </div>
            <div class="pa-1 text-caption">
                <div v-for="e in anno.entries">
                    <div v-if="e.type === ANNO_TYPE.TEXT">
                        <p>{{ e.text }}</p>
                    </div>
                </div>
            </div>
        </div>
    </v-sheet>
</template>

<script setup>
    import { useApp } from '@/stores/app';
    import { storeToRefs } from 'pinia';
    import DM from '@/use/data-manager';
    import { onMounted, ref, watch } from 'vue';
    import { ANNO_TYPE } from '@/use/annotation/annotation-entry';

    const app = useApp()
    const { selectionTime, annoTime, llmLoading } = storeToRefs(app)

    const annos = ref([])

    // read the current annotation (if there is one)
    function readAnnotations() {
        annos.value = DM.getMatchingAnnotations()
    }

    onMounted(readAnnotations)

    watch(selectionTime, readAnnotations)
    watch(annoTime, readAnnotations)
</script>