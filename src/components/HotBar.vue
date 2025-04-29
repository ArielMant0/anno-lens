<template>
    <v-sheet density="compact" class="pa-2 hotbar d-flex align-center justify-center" rounded elevation="4">

        <div v-for="(m, i) in mappings"
            :key="'km:'+m.id"
            :style="{
                marginRight: i === 0 ? '4px' : '0',
                marginLeft: i > 1 ? '4px' : '0',
            }">
            <div class="keylabel text-dots" :style="{ minWidth: '75px', maxWidth: '75px', minHeight: '1em' }">
                <input v-if="m && !m.locked" v-model="m.label" style="max-width: 100%; text-align: center;" :title="m.label">
                <span v-else-if="m && m.locked" style="max-width: 100%; text-align: center;" :title="m.label">{{ m.label }}</span>
                <span v-else style="max-width: 100%; text-align: center;"></span>
            </div>
            <v-btn
                height="40"
                variant="flat"
                :color="m && m.color ? m.color : '#ddd'"
                density="compact"
                stacked
                :class="{ aPulse: m && m.id === trigger }"
                :style="{ maxWidth: '100%', fontSize: '12px' }"
                @click="annotate(m)"
                @contextmenu.prevent="record(i)">
                <div v-if="m && m.key">
                    <div v-for="str in controls.formatArray(m.key, m.modifiers)">
                        {{ str }}
                    </div>
                </div>
            </v-btn>
        </div>
    </v-sheet>
</template>

<script setup>
    import { useControls } from '@/stores/controls';
    import { storeToRefs } from 'pinia';
    import { watch } from 'vue';
    import { toast } from 'vue3-toastify';

    const controls = useControls()
    const { mappings, recording, recordMessage, trigger } = storeToRefs(controls)

    let toastId = null;

    function annotate(mapping) {
        if (mapping) {
            mapping.callback(mapping)
        }
    }
    function record(i) {
        controls.startRecordHotkey(i, 'group '+(i+1), annotate)
    }

    watch(recording, function() {
        if (!recording.value && toastId !== null) {
            toast.remove(toastId)
            toastId = null
        }
    })

    watch(recordMessage, function(msg) {
        if (recording.value && msg.length > 0) {
            if (toastId !== null) {
                toast.update(toastId, { render: msg })
            } else {
                toastId = toast.loading(msg, { isLoading: true, position: toast.POSITION.TOP_CENTER })
            }
        }
    })

</script>

<style scoped>
.hotbar {
    z-index: 500;
    position: fixed;
    bottom: -15px;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0 auto;
}

.keylabel {
    text-align: center;
    font-size: 12px;
}
</style>