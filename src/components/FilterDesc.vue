<template>
    <div class="text-caption">
        <v-btn icon="mdi-close" color="error" variant="text" density="compact" size="sm" @click="emit('clear')"/>
        <span class="mr-1">{{ name }}: </span>

        <div v-if="ordinal" class="d-flex align-center ml-4">
            <span v-if="data.length === 1">
                {{ data[0] }}
                <v-icon :color="scale(data[0])" size="small">mdi-circle</v-icon>
            </span>
            <span v-else>
                <v-icon v-for="d in data" :color="scale(d)" size="small">mdi-circle</v-icon>
            </span>
        </div>
        <div v-else class="d-flex align-center ml-4">
            <span>
                {{ formatter(data[0]) }}
                <v-icon :color="scale(data[0])" size="small">mdi-circle</v-icon>
            </span>
            <span class="ml-1 mr-1">to</span>
            <span>
                {{ formatter(data[1]) }}
                <v-icon :color="scale(data[1])" size="small">mdi-circle</v-icon>
            </span>
        </div>
    </div>
</template>

<script setup>
    import { format } from 'd3';

    const props = defineProps({
        data: {
            type: Array,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        scale: {
            type: Function,
            required: true
        },
        ordinal: {
            type: Boolean,
            default: true
        }
    })

    const emit = defineEmits(["clear"])

    const formatter = format(".2s")
</script>