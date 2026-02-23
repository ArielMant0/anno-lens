<template>
    <div style="width: 100%;">
        <div class="mt-2 mb-2">
            <v-text-field v-model="search"
                placeholder="search attributes .."
                density="compact"
                hide-details
                hide-spin-buttons
                clearable
                variant="outlined"/>
        </div>

        <div class="d-flex flex-column align-center" :style="{ maxHeight: (showHotbar ? 45 : 50)+'vh', overflowY: 'auto' }">

            <div style="text-align: center; width: 100%;" class="mb-1 text-dots">
                <v-icon :color="colorP" class="mr-1" size="small">mdi-circle-outline</v-icon>
                <span :style="{ fontWeight: activeLens === 0 ? 'bold' : null }">primary</span>
            </div>

            <div :style="{ width: (2*(chartWidth+10))+'px' }" class="d-flex flex-wrap">

                <div v-for="i in fP"
                    class="text-caption"
                    :key="'p_'+colsP[i]+'_'+i"
                    :style="{
                        textAlign: 'center',
                        border: '1px solid ' + (colsP[i] === selectedColumn ? 'black' : 'white'),
                        borderRadius: '4px',
                        marginRight: '4px',
                        marginLeft: '4px'
                    }">
                    <div>
                        <div @click="setColor(0, i)" :style="{ maxWidth: (chartWidth-5)+'px' }" class="cursor-pointer text-dots hover-bold">
                            {{ i+1 }}. {{ colsP[i] }}
                        </div>
                        <BarChart
                            :title="colsP[i]"
                            :data="getMerged(0, colsP[i])"
                            :y-domain="[0, 1]"
                            color-attr="color"
                            pattern-attr="pattern"
                            label-attr="group"
                            selectable
                            outline="black"
                            @click="v => annotate(0, i, v.x)"
                            :width="chartWidth"
                            :height="chartHeight"/>
                    </div>
                </div>
            </div>

            <v-divider v-if="fOP.length > 0" color="black" class="mt-2 mb-4" thickness="4" opacity="1"></v-divider>

            <div :style="{ width: (2*(chartWidth+10))+'px' }" class="d-flex flex-wrap">
                <div v-for="i in fOP"
                    class="text-caption"
                    :key="'po_'+colsOtherP[i]+'_'+i"
                    :style="{
                        textAlign: 'center',
                        border: '1px solid ' + (colsOtherP[i] === selectedColumn ? 'black' : 'white'),
                        borderRadius: '4px',
                        backgroundColor: '#eee',
                        marginRight: '4px',
                        marginLeft: '4px'
                    }">
                    <div>
                        <div :style="{ maxWidth: (chartWidth-5)+'px' }" class="cursor-pointer text-dots hover-bold">
                            {{ colsOtherP[i] }}
                        </div>
                        <BarChart
                            :title="colsOtherP[i]"
                            :data="histG.get(colsOtherP[i])"
                            :y-domain="[0, 1]"
                            color-attr="color"
                            pattern-attr="pattern"
                            label-attr="group"
                            outline="black"
                            :width="chartWidth"
                            :height="chartHeight"/>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import DM from '@/use/data-manager';
    import { computed, onMounted, reactive, ref, watch } from 'vue';
    import BarChart from './vis/BarChart.vue';
    import { useApp } from '@/stores/app';
    import { calcHistogram } from '@/use/util';
    import { useControls } from '@/stores/controls';
    import { storeToRefs } from 'pinia';
    import CM from '@/use/command-manager';

    const app = useApp()
    const { activeLens, showHotbar } = storeToRefs(app)

    const controls = useControls()

    const props = defineProps({
        active: {
            type: Boolean,
            default: true
        },
        selectedColumn: {
            type: String,
            required: true
        },
        mode: {
            type: String,
            required: true
        },
        chartWidth: {
            type: Number,
            default: 200
        },
        chartHeight: {
            type: Number,
            default: 80
        },
        time: {
            type: Number,
            default: 0
        },
        lensIndex: {
            type: Number,
            default: 0
        }
    })

    const emit = defineEmits(["update"])

    const search = ref("")

    const colsP = ref([])
    const colsOtherP = ref([])
    const fP = computed(() => {
        if (search.value && search.value.length > 0) {
            return colsP.value.map((d, i) => d.includes(search.value) ? i : null)
                .filter(d => d !== null)
        }
        return colsP.value.map((_, i) => i)
    })
    const fOP = computed(() => {
        if (search.value && search.value.length > 0) {
            return colsOtherP.value.map((d, i) => d.includes(search.value) ? i : null)
                .filter(d => d !== null)
        }
        return colsOtherP.value.map((_, i) => i)
    })


    const colorP = ref("")

    const histG = new Map()

    function setColor(lensIndex, columnIndex) {
        app.setColorIndex(lensIndex, columnIndex)
        emit("update")
    }

    function annotate(lensIndex, columnIndex, columnValue=null) {
        const lens = DM.getLens(lensIndex)
        DM.annotate(
            lensIndex,
            columnIndex,
            props.mode,
            lens.type,
            CM.getColor(5),
            columnValue
        )
    }

    function getMerged(index, column) {
        const lens = DM.getLens(index)
        const other = lens.hists[column] ? lens.hists[column] : []
        const data = other.concat(histG.get(column))
        data.sort((a, b) => {
            if (a.x !== b.x) {
                return a.x - b.x
            }
            return b.y - a.y
        })
        return data
    }

    function read() {
        const limit = props.active ? undefined : 5

        const p = DM.getLens(props.lensIndex)

        colorP.value = p.color ? p.color : "black"
        // get column names (in order, for each lens)
        const pc = p.results[props.mode].map(d => d.name).slice(0, limit)

        const inP = new Set(pc)

        if (props.active) {
            const allCols = Array.from(histG.keys())
            colsOtherP.value = allCols.filter(c => !inP.has(c))
        } else {
            colsOtherP.value = []
        }

        colsP.value = pc
    }

    function readGlobal() {
        const data = DM.getData()
        DM.columns.forEach((c, i) => {
            const h = calcHistogram(data, c, DM.types[i], DM.filterStats, DM.scales[c])
            h.forEach(d => {
                d.pattern = true
                d.group = "global"
            })
            histG.set(c, h)
        })
    }

    onMounted(function() {
        readGlobal()
        read()
    })

    watch(() => app.dataset, readGlobal)

    watch(() => props.active, read)
    watch(() => props.time, read)
</script>