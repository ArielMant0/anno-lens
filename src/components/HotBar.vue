<template>
    <v-sheet density="compact" class="pa-1 hotbar d-flex align-center justify-center" rounded color="#efefef">
        <div v-for="(m, i) in mappings" :key="'keymap:'+i" :style="{ marginRight: i === 0 ? '4px' : '0', marginLeft: i > 1 ? '4px' : '0' }">
            <div class="keylabel text-dots" :style="{ width: '50px', maxWidth: '50px', minHeight: '1.5em' }">{{ m ? m.label : ' ' }}</div>
            <v-sheet
                width="50"
                height="50"
                class="pa-0 d-flex align-center justify-center"
                rounded
                :style="{ border: '3px solid '+controls.getColor(i) }">
                <span v-if="m">{{ controls.format(m.key) }}</span>
            </v-sheet>
        </div>
    </v-sheet>
</template>

<script setup>
    import { useControls } from '@/stores/controls';
    import { storeToRefs } from 'pinia';

    const controls = useControls()
    const { mappings } = storeToRefs(controls)
</script>

<style scoped>
.hotbar {
    z-index: 500;
    position: fixed;
    bottom: 0px;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0 auto;
}

.keylabel {
    text-align: center;
    font-size: 12px;
}
</style>