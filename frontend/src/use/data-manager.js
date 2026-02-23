import { DATA_TYPES, useApp } from "@/stores/app"
import { bin, deviation, min, mean, median, quadtree, scaleLinear, extent, group, polygonHull, polygonCentroid } from "d3"
import { circleIntersect, dataToNumbers, euclidean, findInCircle, getAttr } from "./util"
import { Lens, LENS_TYPE } from "./Lens"

import MyWorker from '@/worker/feature-worker?worker'
import { LensSelection } from "./selection/selection";
import Annotation from "./annotation/annotation";
import { TextEntry } from "./annotation/annotation-entry";

function calcStats(data, c, filterType) {
    const ord = filterType === DATA_TYPES.ORDINAL || filterType === DATA_TYPES.NOMINAL || filterType === DATA_TYPES.BOOLEAN
    const vals = dataToNumbers(data, c, filterType)
    let [minVal, maxVal] = extent(vals)
    let value = deviation(vals) / (maxVal - minVal)

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
        this.selections = []

        this.width = 0
        this.height = 0
        this.xAttr = ""
        this.yAttr = ""
        this.featureMaps = null
        this.lensMaps = null

        this.annotations = []
        this.tmpAnno = null
        this.annoMap = {}
    }

    setDataset(dsobj) {
        this.getters = dsobj.getters
    }

    addLens(radius, type=LENS_TYPE.RARE, active=true) {
        this.lenses.push(new Lens(radius, type, active))
        // TODO: add selection for lens
        this.selections.push(new LensSelection())
        return this.lenses.at(-1).id
    }

    updateLens(index, x, y, r, subset) {
        if (!this.lenses[index]) return
        this.lenses[index].apply(x, y, r, subset, this.columns, this.types)
        // TODO: update lens selection
        this.selections[index].update(x, y, r)
        this.selections[index].apply(this.tree)
        // TODO: reset temporary annotation (save to history?)
        if (this.tmpAnno !== null) {
            this.tmpAnno = null
        }
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

    getSelectionById(id) {
        return this.selections.find(d => d.id === id)
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
            .range([5, width-5])
        this.y = scaleLinear()
            .domain(extent(data, d => getAttr(d, this.yAttr)))
            .range([height-5, 5])

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

    resize(width, height) {
        if (!this.data || this.data.length === 0 || !this.x || !this.y) return

        let rx, ry;
        if (this.x && this.y) {
            rx = scaleLinear()
                .domain(this.x.range())
                .range([5, width-5])

            ry = scaleLinear()
                .domain(this.y.range())
                .range([height-5, 5])
        }

        // scales for quadtree
        this.x = scaleLinear()
            .domain(extent(this.data, d => getAttr(d, this.xAttr)))
            .range([5, width-5])
        this.y = scaleLinear()
            .domain(extent(this.data, d => getAttr(d, this.yAttr)))
            .range([height-5, 5])

        // calculate quadtree
        this.tree = quadtree()
            .x(d => this.x(getAttr(d, this.xAttr)))
            .y(d => this.y(getAttr(d, this.yAttr)))
            .addAll(this.data)

        if (rx && ry) {
            this.lenses.forEach((l, i) => {
                if (!l.x || !l.y) return
                const lx = rx(l.x), ly = ry(l.y)
                const points = this.findDataInCircle(lx, ly, l.radius)
                this.updateLens(i, lx, ly, l.radius, points)
            })
        }

        // mark as updated
        const app = useApp()
        app.updateData()

        if (rx && ry) {
            this.callbacks.lens.forEach(f => f())
        }
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

    getMatchingAnnotations(limit=0) {
        const ids = this.selections[0].data

        if (limit === 1) {
            // return temporary annotation if it matches
            if (this.tmpAnno && this.tmpAnno.hasDataOverlap(ids)) {
                return this.tmpAnno
            }
            const match = this.annotations.find(d => d.hasDataOverlap(ids))
            return match ? match : null
        } else if (limit > 1) {
            const matches = []
            // add temporary annotation if it matches
            if (this.tmpAnno && this.tmpAnno.hasDataOverlap(ids)) {
                matches.push(this.tmpAnno)
            }
            // add other annotations until the limit is reached
            for (let i = 0; i < this.annotations.length && matches.length <= limit; ++i) {
                const d = this.annotations[i]
                if (d.hasDataOverlap(ids)) {
                    matches.push(d)
                }
            }
            return matches.length > 0 ? matches : null
        } else {
            let matches = []
            // add temporary annotation if it matches
            if (this.tmpAnno && this.tmpAnno.hasDataOverlap(ids)) {
                matches.push(this.tmpAnno)
            }
            matches = matches.concat(this.annotations.filter(d => d.hasDataOverlap(ids)))
            return matches.length > 0 ? matches : null
        }
    }

    get hasTmpAnnotation() {
        return this.tmpAnno !== null
    }

    getTmpAnnotation() {
        return this.tmpAnno
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

    trigger(name) {
        if (this.callbacks[name]) {
            this.callbacks[name].forEach(f => f())
        }
    }

    createEmptyAnnotation() {
        let ids = new Set()
        this.selections.forEach(s => {
            ids = ids.union(s.data)
            s.calculatePolygon(this.data, this.xAttr, this.yAttr, this.x, this.y)
        })
        return new Annotation(ids, this.selections.map(s => s.copy()), "Tmp Anno")
    }

    annotateEmpty() {
        if (this.hasTmpAnnotation) {
            // TODO: put unsaved annotation into history/storage
        }
        this.tmpAnno = this.createEmptyAnnotation()
        this.callbacks.anno.forEach(f => f(this.tmpAnno))
    }

    annotateText(text, src, entities=[], id=null) {

        // TODO: what about global notes where there is no associated selection?
        // TODO: what about unsaved annotations?

        let target = null
        if (id !== null) {
            target = this.getAnnotationById(id)
            if (target) {
                // if the referenced annotation exists, add an entry
                target.addEntry(new TextEntry(target, text, src, entities))
            }
        } else if (this.selections.length === 0) {
            // no data is selected, so make no tmp annotation
            return
        }

        if (this.hasTmpAnnotation) {
            // if we have an unsaved annotation, add the entry to it
            this.tmpAnno.addEntry(new TextEntry(this.tmpAnno, text, src, entities))
            target = this.tmpAnno
        } else {
            // otherwise, create a new unsaved annotation
            this.tmpAnno = this.createEmptyAnnotation()
            this.tmpAnno.addEntry(new TextEntry(this.tmpAnno, text, src, entities))
            target = this.tmpAnno
        }

        if (target) {
            this.callbacks.anno.forEach(f => f(target))
        }
    }

    saveTmpAnnotation() {
        if (this.tmpAnno !== null) {
            this.annotations.push(this.tmpAnno)
            this.tmpAnno = null
            const anno = this.annotations.at(-1)
            this.callbacks.anno.forEach(f => f(anno))
        }
    }

    checkAnnoMerges() {
        const merged = new Set()

        for (let i = 0; i < this.annotations.length-1; ++i) {
            const a = this.annotations[i]
            if (merged.has(a.id)) continue

            const idsA = new Set(a.ids)
            const toMerge = []
            for (let j = i+1; j < this.annotations.length; ++j) {
                const b = this.annotations[j]
                if (merged.has(b.id)) continue

                const int = idsA.intersection(new Set(b.ids))
                if (int.size === idsA.size || int.size > 0 &&
                    a.columns.length === b.columns.length &&
                    a.columns[0].name === b.columns[0].name
                ) {
                    toMerge.push(b)
                    merged.add(b.id)
                }
            }

            const newAnno = this._merge(a, toMerge)

            a.x = newAnno.x
            a.y = newAnno.y
            a.polygon = newAnno.polygon
            a.centroid = newAnno.centroid
            a.columns = newAnno.columns
            a.color = newAnno.color
            a.ids = newAnno.ids
        }

        if (merged.size > 0) {
            this.annotations = this.annotations.filter(d => !merged.has(d.id))
            this.callbacks.anno.forEach(f => f())
        }
    }

    mergeAnnotations(idA, idB) {
        const a = this.annotations.find(d => d.id === idA)
        const b = this.annotations.find(d => d.id === idB)
        if (a && b && idA !== idB) {
            // merge these two annotations
            const newAnno = this._merge(a, [b])
            // update annotation a
            a.x = newAnno.x
            a.y = newAnno.y
            a.polygon = newAnno.polygon
            a.centroid = newAnno.centroid
            a.columns = newAnno.columns
            a.color = newAnno.color
            a.ids = newAnno.ids

            // remove annotation b from list
            this.annotations = this.annotations.filter(d => d.id !== idB)
            // call anno callbacks
            this.callbacks.anno.forEach(f => f())
        }
    }

    _merge(a, others) {

        let idSet = new Set(a.ids)
        let mergeCols = a.columns
        const colSet = new Map(mergeCols.map(d => ([d.name, d.value])))
        const colCounts = new Map()
        mergeCols.forEach(c => colCounts.set(c.color, (colCounts.get(c.color) || 0) + 1))

        others.forEach(b => {
            idSet = idSet.union(new Set(b.ids))
            b.columns.forEach(c => {
                delete this.annoMap[c.name][b.id]
                if (colSet.has(c.name)) {
                    colCounts.set(c.color, (colCounts.get(c.color) || 0) + 1)
                } else {
                    mergeCols.push({ name: c.name, color: c.color, value: c.value })
                    colCounts.set(c.color, (colCounts.get(c.color) || 0) + 1)
                    colSet.set(c.name, c.value)
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

        const points = this.data.filter(d => idSet.has(d.id)).map(d => ([this.x(getAttr(d, this.xAttr)), this.y(getAttr(d, this.yAttr))]))
        const { polygon, centroid } = this._makePolygon(points)

        mergeCols.forEach(c => {
            const n = c.name
            if (!this.annoMap[n]) {
                this.annoMap[n] = {}
            }
            this.annoMap[n][a.id] = true
        })

        return {
            id: a.id,
            mode: a.mode,
            lensType: a.lensType,
            color: a.color,
            x: mean(centroid, c => c[0]),
            y: mean(centroid, c => c[1]),
            polygon: polygon,
            centroid: centroid,
            columns: mergeCols,
            color: annoColor,
            ids: Array.from(idSet.values())
        }
    }

    removeAnnotation(id) {
        const idx = this.annotations.findIndex(d => d.id === id)
        if (idx >= 0) {
            // this.annotations[idx].columns.forEach(c => {
            //     delete this.annoMap[c.name][id]
            // })
            this.annotations.splice(idx, 1)
            this.callbacks.anno.forEach(f => f())
            // this.checkAnnoMerges()
        }
    }

    getAnnotations() {
        return this.annotations
    }

    getAnnotationById(id) {
        if (this.hasTmpAnnotation && this.tmpAnno.id === id) return this.tmpAnno
        return this.annotations.find(d => d.id === id)
    }

    clearAnnotations() {
        this.annoMap = {}
        this.annotations = []
        this.callbacks.anno.forEach(f => f())
    }

    getAnnotationConnections() {
        const nodes = []
        const links = []
        const added = new Set()
        const linksAdded = new Map()

        this.annotations.forEach(ia => {

            const counts = new Map()
            ia.columns.forEach(c => {
                for (const id in this.annoMap[c.name]) {
                    if (id === ia.id) continue
                    if (!added.has(id)) {
                        const ib = this.annotations.find(d => d.id === +id)
                        if (!ib) continue
                        nodes.push({ id: +id, name: "anno "+id, x: ib.x, y: ib.y })
                        added.add(+id)
                    }
                    counts.set(+id, (counts.get(+id) || 0) + 1)
                }
            })

            if (counts.size > 0) {
                if (!added.has(ia.id)) {
                    nodes.push({ id: ia.id, name: "anno "+ia.id, x: ia.x, y: ia.y })
                    added.add(ia.id)
                }
                counts.forEach((value, id) => {
                    let map = linksAdded.get(id)
                    if (!map || !map.has(ia.id)) {
                        links.push({
                            source: ia.id,
                            target: id,
                            value: value
                        })
                        if (!map) {
                            map = new Set()
                        }
                        map.add(ia.id)
                        linksAdded.set(id, map)
                    }
                })
                linksAdded.set(ia.id, new Set(counts.keys()))
            }
        })

        return { nodes: nodes, links: links }
    }
}

const DM = new DataManager()

export { DM as default }