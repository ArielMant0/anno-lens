import { DATA_TYPES, useApp } from "@/stores/app"
import { bin, deviation, min, max, mean, median, quadtree, scaleLinear, extent, group } from "d3"
import { circleIntersect, dataToNumbers, euclidean, findInCircle, getAttr } from "./util"
import { Lens, LENS_TYPE } from "./Lens"

let _ANNO_ID = 1;

import MyWorker from '@/worker/feature-worker?worker'

function calcStats(data, c, filterType) {
    const ord = filterType === DATA_TYPES.ORDINAL || filterType === DATA_TYPES.NOMINAL || filterType === DATA_TYPES.BOOLEAN
    const vals = dataToNumbers(data, c, filterType)
    let maxVal = max(vals)
    let value = deviation(vals) / maxVal

    let unique = [], count = 0, countRel = 0
    if (ord) {
        if (filterType === DATA_TYPES.BOOLEAN) {
            unique = [false, true]
            count = vals.reduce((acc, v) => acc + (v ? 1 : 0), 0)
            countRel = count / vals.length
            value = count === 0 || count === vals.length ? 0 : 1 - countRel
        } else {
            const gr = group(data, d => getAttr(d, c))
            count = {}
            countRel = {}
            gr.forEach((list, name) => {
                count[name] = list.length
                countRel[name] = list.length / vals.length
                unique.push(name)
            })
            unique.sort((a, b) => a-b)
        }
    } else {
        const tmp = bin().thresholds(5)(vals)
        unique = tmp.map(d => d.x0) //.concat(tmp.at(-1).x1)
        count = tmp.map(d => d.length)
        countRel = tmp.map(d => d.length / vals.length)
    }
    return {
        min: min(vals),
        max: maxVal,
        bins: unique,
        count: count,
        countRel: countRel,
        mean: mean(vals),
        median: median(vals),
        value: value,
    }
}

class DataManager {

    constructor() {
        this.filterIds = new Set()
        this.reset()
    }

    reset() {
        this.tree = null
        this.data = []
        this.columns = []
        this.types = []
        this.scales = {}
        this.getters = null

        this.stats = {}
        this.filterStats = {}
        this.filterIds.clear()

        this.lenses = []

        this.width = 0
        this.height = 0
        this.xAttr = ""
        this.yAttr = ""
        this.featureMaps = null
        this.lensMaps = null

        this.annotations = []
        this.annoTree = null
        this.annoMap = {}
        _ANNO_ID = 1
    }

    setDataset(dsobj) {
        this.getters = dsobj.getters
    }

    addLens(type=LENS_TYPE.RARE, active=true) {
        this.lenses.push(new Lens(type, active))
        return this.lenses.at(-1).id
    }

    updateLens(index, x, y, r, subset) {
        if (!this.lenses[index]) return
        this.lenses[index].apply(x, y, r, subset, this.columns, this.types)
    }

    clearLens(index) {
        if (!this.lenses[index]) return
        this.lenses[index].reset()
    }

    hasLens(index) {
        return this.lenses[index] !== undefined
    }

    hasLensResult(index) {
        return this.lenses[index].getResultSize() > 0
    }

    getLens(index) {
        if (!this.hasLens(index)) return null
        return this.lenses[index]
    }

    getLensData(index) {
        if (!this.hasLens(index)) return []
        return this.lenses[index].getResultData()
    }

    getLensResults(index, mode) {
        if (!this.hasLens(index)) return []
        return this.lenses[index].getResult(mode)
    }

    setData(data=[], columns=[], types=[], xAttr="x", yAttr="y", width=500, height=500) {
        this.data = data
        this.columns = columns
        this.types = types
        this.xAttr = xAttr
        this.yAttr = yAttr
        this.width = width
        this.height = height

        // calculate stats
        this.stats = {}
        columns.forEach((c, i) => this.stats[c] = calcStats(data, c, types[i]))
        this.filterStats = this.stats;

        // scales for quadtree
        this.x = scaleLinear()
            .domain(extent(data, d => getAttr(d, this.xAttr)))
            .range([0, width])
        this.y = scaleLinear()
            .domain(extent(data, d => getAttr(d, this.yAttr)))
            .range([height, 0])

        // calculate quadtree
        this.tree = quadtree()
            .x(d => this.x(getAttr(d, this.xAttr)))
            .y(d => this.y(getAttr(d, this.yAttr)))
            .addAll(data)

        // mark as updated
        const app = useApp()
        app.updateData()
    }

    getData(filter=true) {
        if (filter && this.filterIds.size > 0) {
            return this.data.filter(d => this.filterIds.has(d))
        }
        return this.data
    }

    computeFeatureMaps(radius, size=10, callback=null) {
        if (this.data.length === 0) return

        const myWorker = new MyWorker();
        // set map upon completion
        myWorker.onmessage = e => {
            console.log("received message from worker")
            this.featureMaps = e.data.maps
            this.lensMaps = e.data.lenses
            if (callback) {
                callback(this.featureMaps)
            }
        }
        // compute feature maps in web worker
        myWorker.postMessage({
            columns: this.columns,
            types: this.types,
            data: this.data,
            stats: this.filterStats,
            width: this.width,
            height: this.height,
            radius: radius,
            size: size,
        })
    }

    computeFilterStats(ids) {
        this.filterIds = new Set(ids)
        if (ids.length === 0) {
            this.filterStats = this.stats
        } else {
            const data = this.data.filter(d => this.filterIds.has(d.id))
            this.columns.forEach((c, i) => this.filterStats[c] = calcStats(data, c, this.types[i]))
        }
    }

    getBestFeatures(lensType, mode) {
        if (!this.featureMaps) return []
        const cols = this.columns.slice()
        cols.sort((a, b) => this.featureMaps[a][mode+'Mean'] - this.featureMaps[b][mode+'Mean'])
        if (lensType === LENS_TYPE.RARE) {
            cols.reverse()
        }
        return cols
    }

    getMatchingLenses(x, y, r, lensIndex, mode, columnIndex) {
        if (!this.lensMaps || !this.lenses[lensIndex]) return []
        // get lens result
        const n = this.lenses[lensIndex].getResultColumn(mode, columnIndex)
        const v = this.lenses[lensIndex].getResultValue(mode, columnIndex)
        // return if there are no other lenses (doubt)
        if (!this.lensMaps[n] || this.lensMaps[n].length === 0) return []
        let lenses = this.lensMaps[n].filter(d => !circleIntersect(x, y, r, d[0], d[1], r))
        const vidx = mode === "local" ? 3 : 4
        const size = this.lenses[lensIndex].getResultSize()
        lenses = lenses.filter(d => Math.abs(d[vidx]-v) < DM.filterStats[n].value)
        if (lenses.length === 0) return []

        lenses
            .sort((a, b) => {
                const vdiff = Math.abs(a[vidx]-v) - Math.abs(b[vidx]-v)
                return vdiff !== 0 ? vdiff : Math.abs(a[2]-size) - Math.abs(b[2]-size)
            })

        return [lenses[0]]
    }

    findDataInCircle(x, y, radius) {
        return findInCircle(this.tree, x, y, radius)
    }

    setScales(scales={}) {
        this.scales = scales
    }

    getDataBy(filter) {
        return this.data.filter(filter)
    }

    annotate(index, radius, columnIndex, mode, lensType) {
        if (this.annoTree === null) {
            this.annoTree = quadtree()
                .x(d => d.x)
                .y(d => d.y)
                .extent([[0, 0], [this.width, this.height]])
        }

        const lens = this.getLens(index)
        const allCols = lens.getResult(mode)
        const start = Math.max(0, columnIndex-1)
        const end = Math.min(allCols.length, start === 0 ? 3 : columnIndex+2)
        const cols = allCols.slice(start, end)

        const annos = this.annoTree.data()
        const overlap = annos.filter(d => {
            if (d.lensType !== lensType || d.mode !== mode) return false
            const set = lens.ids.intersection(new Set(d.ids))
            return set.size > d.ids.length * 0.5 || set.size > 0.5 * lens.ids.size
        })

        const id = _ANNO_ID++
        let addObj;

        // merge annotations
        if (overlap.length > 0) {
            const x = mean(overlap.map(d => d.x).concat([lens.x]))
            const y = mean(overlap.map(d => d.y).concat([lens.y]))

            let mergeCols = cols
            let colSet = new Set(cols.map(d => d.name))
            let idSet = new Set(lens.ids)

            overlap.forEach(d => {
                this.annoTree.remove(d)
                idSet = idSet.union(new Set(d.ids))
                d.columns.forEach(c => {
                    delete this.annoMap[c.name][d.id]
                    if (colSet.has(c.name)) {
                        const it = mergeCols.find(dd => dd.name === c.name)
                        it.value = it.value + c.value
                        it.count = (it.count || 1) + 1
                    } else {
                        mergeCols.push(c)
                    }
                })
            })

            const points = this.data.filter(d => idSet.has(d.id))
            const r = max(points.map(d => euclidean(x, y, this.x(getAttr(d, this.xAttr)), this.y(getAttr(d, this.yAttr)))))

            // compute average value for merged columns
            mergeCols.forEach(d => {
                if (d.count) {
                    d.value = d.value / d.count
                }
            })

            addObj = {
                id: id,
                x: x,
                y: y,
                radius: r,
                mode: mode,
                lensType: lensType,
                columns: mergeCols,
                ids: Array.from(idSet.values())
            }
        } else {
            addObj = {
                id: id,
                x: lens.x,
                y: lens.y,
                radius: radius,
                mode: mode,
                lensType: lensType,
                columns: cols,
                ids: lens.getResultIds()
            }
        }

        addObj.columns.forEach(c => {
            const n = c.name
            if (!this.annoMap[n]) {
                this.annoMap[n] = {}
            }

            if (this.annoMap[n][id]) {
                this.annoMap[n][id].push(c.value)
            } else {
                this.annoMap[n][id] = [c.value]
            }
        })

        if (addObj) {
            this.annoTree.add(addObj)
        }

    }

    getAnnotations() {
        return this.annoTree ? this.annoTree.data() : []
    }

    getAnnotationConnections() {
        const nodes = []
        const added = new Set()
        const links = []

        const annos = this.annoTree ? this.annoTree.data() : []

        for (const name in this.annoMap) {
            const ids = Object.keys(this.annoMap[name]).map(d => +d)
            for (let i = 0; i < ids.length; ++i) {
                const ia = annos.find(d => d.id === ids[i])
                const iav = ia.columns.find(d => d.name === name)
                // add new nodes
                if (!added.has(ids[i])) {
                    added.add(ids[i])
                    nodes.push({ id: ids[i], name: ids[i], x: ia.x, y: ia.y })
                }
                // add links for all other nodes to this node
                for (let j = i+1; j < ids.length; ++j) {
                    const jav = annos.find(d => d.id === ids[j]).columns.find(d => d.name === name)
                    links.push({
                        source: ids[i],
                        target: ids[j],
                        name: name,
                        value: iav.value * jav.value
                    })
                }
            }
        }
        return { nodes: nodes, links: links }
    }
}

const DM = new DataManager()

export { DM as default }