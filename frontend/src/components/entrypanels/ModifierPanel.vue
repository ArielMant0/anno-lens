<template>
    <div>
        <div v-if="modifier.type === MODIFIER_TYPE.COLOR_FUNCTION" class="d-flex align-start" :style="{ height: '150px' }">
            <v-slider v-for="col in modifier.entities"
                v-model="col.value"
                :key="col.name"
                :label="col.name"
                :min="0"
                :max="1"
                :max-width="100"
                direction="vertical"
                class="text-caption"
                @update:model-value="refreshColor"
                />
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
        app.setColor("_color")
    }

</script>