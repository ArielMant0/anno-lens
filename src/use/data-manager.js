import { DATA_TYPES, useApp } from "@/stores/app"
import { bin, deviation, min, max, mean, median, quadtree, scaleLinear, extent, group, polygonHull, polygonCentroid } from "d3"
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
        this.callbacks = { lens: [], anno: [] }
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

    swapLenses(i, j) {
        if (!this.lenses[i] || !this.lenses[j]) return
        const tmp = this.lenses[i]
        const col = tmp.color
        this.lenses[i] = this.lenses[j]
        this.lenses[j] = tmp
        this.lenses[j].color = this.lenses[i].color
        this.lenses[i].color = col
        this.callbacks.lens.forEach(f => f())
    }

    hasLens(index) {
        return this.lenses[index] !== undefined
    }

    hasLensResult(index) {
        return this.lenses[index].getResultSize() > 0
    }

    onLens(callback) {
        this.callbacks.lens.push(callback)
    }

    onAnnotation(callback) {
        this.callbacks.anno.push(callback)
    }

    getLens(index) {
        if (!this.hasLens(index)) return null
        return this.lenses[index]
    }

    getLensIndex(id) {
        return this.lenses.findIndex(d => d.id === id)
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

        const lens = this.getLens(lensIndex)

        // get lens result
        const n = lens.getResultColumn(mode, columnIndex)
        const v = lens.getResultValue(mode, columnIndex)
        // return if there are no other lenses (doubt)
        if (!this.lensMaps[n] || this.lensMaps[n].length === 0) return []

        const vidx = mode === "local" ? 3 : 4
        const size = this.lenses[lensIndex].getResultSize()
        const lenses = this.lensMaps[n]
            .filter(d => !circleIntersect(x, y, r, d[0], d[1], r) && Math.abs(d[vidx]-v) < DM.filterStats[n].value)

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

    annotate(lensIndex, columnIndex, mode, lensType, color) {

        const lens = this.getLens(lensIndex)
        const col = lens.getResult(mode)[columnIndex]

        const overlap = this.annotations.filter(d => {
            if (d.lensType !== lensType || d.mode !== mode) return false
            const set = lens.ids.intersection(new Set(d.ids))
            return set.size > d.ids.length * 0.5 || set.size > 0.5 * lens.ids.size
        })

        const id = _ANNO_ID++
        let addObj;

        // merge annotations
        if (overlap.length > 0) {

            let mergeCols = [{ name: col.name, count: 1, color: color }]
            let colSet = new Set([col.name])
            let idSet = new Set(lens.ids)

            const colCounts = new Map()
            colCounts.set(color, 1)

            overlap.forEach(d => {
                this.annotations.splice(this.annotations.findIndex(a => a.id === d.id), 1)
                idSet = idSet.union(new Set(d.ids))
                d.columns.forEach(c => {
                    delete this.annoMap[c.name][d.id]
                    if (colSet.has(c.name)) {
                        const it = mergeCols.find(dd => dd.name === c.name)
                        it.count += c.count
                        colCounts.set(c.color, (colCounts.get(c.color) || 0) + 1)
                    } else {
                        mergeCols.push({ name: c.name, count: c.count, color: c.color })
                        colCounts.set(c.color, (colCounts.get(c.color) || 0) + 1)
                    }
                })
            })

            let annoColor, maxCount = 0;
            colCounts.forEach((theCount, theColor) => {
                if (theCount > maxCount) {
                    annoColor = theColor;
                    maxCount = theCount
                }
            })

            const points = this.data.filter(d => idSet.has(d.id))
            let polygon = polygonHull(points.map(d => ([this.x(getAttr(d, this.xAttr)), this.y(getAttr(d, this.yAttr))])))
            const centroid = polygonCentroid(polygon)
            polygon = polygon.map(([px, py]) => {
                const vx = px - centroid[0]
                const vy = py - centroid[1]
                const norm = Math.sqrt(vx*vx + vy*vy)
                return [px + vx / norm * 5, py + vy / norm * 5]
            })

            addObj = {
                id: id,
                x: centroid[0],
                y: centroid[1],
                polygon: polygon,
                mode: mode,
                lensType: lensType,
                columns: mergeCols,
                ids: Array.from(idSet.values()),
                color: annoColor
            }
        } else {
            let idSet = new Set(lens.ids)
            const points = this.data.filter(d => idSet.has(d.id))
            let polygon = polygonHull(points.map(d => ([this.x(getAttr(d, this.xAttr)), this.y(getAttr(d, this.yAttr))])))
            const centroid = polygonCentroid(polygon)
            polygon = polygon.map(([px, py]) => {
                const vx = px - centroid[0]
                const vy = py - centroid[1]
                const norm = Math.sqrt(vx*vx + vy*vy)
                return [px + vx / norm * 5, py + vy / norm * 5]
            })

            addObj = {
                id: id,
                x: centroid[0],
                y: centroid[1],
                polygon: polygon,
                mode: mode,
                lensType: lensType,
                columns: [{ name: col.name, count: 1, color: color }],
                ids: Array.from(idSet.values()),
                color: color
            }
        }

        addObj.columns.forEach(c => {
            const n = c.name
            if (!this.annoMap[n]) {
                this.annoMap[n] = {}
            }

            if (this.annoMap[n][id]) {
                this.annoMap[n][id].push(c.count)
            } else {
                this.annoMap[n][id] = [c.count]
            }
        })

        if (addObj) {
            this.annotations.push(addObj)
            this.callbacks.anno.forEach(f => f(addObj))
        }

    }

    removeAnnotation(id) {
        const idx = this.annotations.findIndex(d => d.id === id)
        if (idx >= 0) {
            this.annotations[idx].columns.forEach(c => {
                delete this.annoMap[c.name][id]
            })
            this.annotations.splice(idx, 1)
            this.callbacks.anno.forEach(f => f())
        }
    }

    removeAnnotationColumn(id, name) {
        const anno = this.annotations.find(d => d.id === id)
        if (anno) {
            if (anno.columns.length === 1) {
                this.removeAnnotation(id)
            } else {
                const idx = anno.columns.findIndex(c => c.name === name)
                if (idx >= 0) {
                    delete this.annoMap[name][id]
                    anno.columns.splice(idx, 1)
                    this.callbacks.anno.forEach(f => f())
                }
            }
        }
    }

    getAnnotations() {
        return this.annotations
    }

    getAnnotationConnections() {
        const nodes = []
        const added = new Set()
        const links = []

        for (const name in this.annoMap) {
            const ids = Object.keys(this.annoMap[name]).map(d => +d)
            for (let i = 0; i < ids.length; ++i) {
                const ia = this.annotations.find(d => d.id === ids[i])
                const iav = ia.columns.find(d => d.name === name)
                // add new nodes
                if (!added.has(ids[i])) {
                    added.add(ids[i])
                    nodes.push({ id: ids[i], name: ids[i], x: ia.x, y: ia.y })
                }
                // add links for all other nodes to this node
                for (let j = i+1; j < ids.length; ++j) {
                    const jav = this.annotations.find(d => d.id === ids[j]).columns.find(d => d.name === name)
                    links.push({
                        source: ids[i],
                        target: ids[j],
                        name: name,
                        value: iav.count + jav.count
                    })
                }
            }
        }
        return { nodes: nodes, links: links }
    }
}

const DM = new DataManager()

export { DM as default }