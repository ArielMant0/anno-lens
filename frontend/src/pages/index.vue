<template>
    <div style="height: 100vh;" class="pa-2">
        <v-overlay v-if="!ready" absolute>
            <v-progress-circular size="64" indeterminate></v-progress-circular>
        </v-overlay>
        <MultiLensVis/>
        <template v-if="ready && initialized">
            <GlobalSettings/>
            <HotBar v-if="!useChat"/>
        </template>
        <HoverOverlay/>
        <TargetingOverlay/>
        <CommandEditingPanel/>
    </div>
</template>

<script setup>
    import TargetingOverlay from '@/components/TargetingOverlay.vue';
    import MultiLensVis from '@/components/MultiLensVis.vue';
    import { useApp } from '@/stores/app';
    import { useControls } from '@/stores/controls';
    import { storeToRefs } from 'pinia';
    import { onMounted } from 'vue';
    import HotBar from '@/components/HotBar.vue';
    import GlobalSettings from '@/components/GlobalSettings.vue';
    import CommandEditingPanel from '@/components/CommandEditingPanel.vue';
    import HoverOverlay from '@/components/HoverOverlay.vue';

    const app = useApp()
    const controls = useControls()

    const { ready, initialized, useChat } = storeToRefs(app)

    onMounted(function() {
        window.addEventListener("keydown", (event) => controls.keyEvent(event))
    })

</script>

<style>
.text-dots {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.hover-italic:hover {
    font-style: italic;
}
.hover-bold:hover {
    font-weight: bold;
}
.hover-bg-grey:hover {
    background-color: #efefef;
}

.aPulse {
    animation: pulse 500ms cubic-bezier(0.33, 1, 0.68, 1) infinite;
}
.aSat {
    animation: sat 500ms cubic-bezier(0.33, 1, 0.68, 1) infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.15);
    }

    100% {
        transform: scale(1);
    }
}

@keyframes sat {
    0% {
        filter: saturate(1)
    }

    50% {
        filter: saturate(1.5)
    }

    100% {
        filter: saturate(1)
    }
}

</style>
