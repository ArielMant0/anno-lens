<template>
    <v-sheet rounded elevation="2" min-height="100" style="width: 100%;">

        <AnnotationPanel v-for="anno in annos"
            :key="anno.id+'_'+anno.timeUpdated"
            width="100%"
            :data="anno"/>

        <TextNote v-if="annos === null" class="mt-2 mr-1 ml-1" @submit="DM.saveTmpAnnotation()"/>

        <div v-if="llmLoading" class=" mt-4 d-flex align-center justify-center">
            <v-progress-circular size="32" indeterminate></v-progress-circular>
        </div>
    </v-sheet>
</template>

<script setup>
    import { useApp } from '@/stores/app';
    import { storeToRefs } from 'pinia';
    import DM from '@/use/data-manager';
    import { onMounted, ref, watch } from 'vue';
    import AnnotationPanel from './AnnotationPanel.vue';
    import TextNote from './TextNote.vue';

    const app = useApp()
    const { lensMoveTime, annoTime, llmLoading } = storeToRefs(app)

    const annos = ref([])

    // read the current annotation (if there is one)
    function readAnnotations() {
        annos.value = DM.getMatchingAnnotations()
    }

    onMounted(readAnnotations)

    watch(lensMoveTime, readAnnotations)
    watch(annoTime, readAnnotations)
</script>