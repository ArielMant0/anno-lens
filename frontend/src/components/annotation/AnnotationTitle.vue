<template>
    <div class="d-flex align-center">
        <template v-if="size">
            <div class="text-caption">{{ size }}<v-icon size="small">mdi-scatter-plot</v-icon></div>
            <v-divider vertical class="ml-1 mr-2"></v-divider>
        </template>
        <input v-model="model" type="text" style="font-weight: bold;"/>
    </div>
</template>

<script setup>

    const model = defineModel({ type: String, required: true })
    const props = defineProps({
        size: { type: Number, required: false },
    })
</script>