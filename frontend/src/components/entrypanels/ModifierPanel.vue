<template>
    <div>
        <div v-if="modifier.type === MODIFIER_TYPE.COLOR_FUNCTION">
            <div v-for="col in modifier.entities" :key="col.name" class="d-flex align-center">
                <div style="width: 100px;" class="text-dots">
                    {{ col.name }}
                    <span style="font-size: smaller;">({{ col.value.toFixed(1) }})</span>
                </div>
                <v-slider
                    v-model="col.value"
                    :min="0"
                    :max="1"
                    class="text-caption"
                    @update:model-value="refreshColor"
                    hide-details
                    hide-spin-buttons
                    density="compact"
                    />
            </div>
        </div>
    </div>
</template>

<script setup>
    import { useApp } from '@/stores/app';
    import DM from '@/use/data-manager';
    import { Modifier, MODIFIER_TYPE } from '@/use/modifiers';

    const props = defineProps({
        modifier: { type: Modifier, required: true }
    })

    const app = useApp()

    function refreshColor() {
        DM.getData(false).forEach(d => props.modifier.apply(d))
        DM.recomputeFeatureMap(props.modifier.type, 10, function() {
            app.featureTime = Date.now()
        })
    }

</script>