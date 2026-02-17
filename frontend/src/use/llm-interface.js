import { useLoader } from "./loader";

export async function llmSummary(data, limit=30) {
    const loader = useLoader()
    return loader.post("summary", { limit: limit, data: data })
}

export async function llmComparison(dataA, dataB, limit=30) {
    const loader = useLoader()
    return loader.post("comparison", { limit: limit, dataA: dataA, dataB: dataB })
}

export async function llmSummaryFunction(data, limit=30) {
    const loader = useLoader()
    return loader.post("summaryfunction", { limit: limit, data: data })
}

export async function llmExtract(keyword, data, global, number=5, limit=30) {
    const loader = useLoader()
    return loader.post("extract", {
        keyword: keyword,
        data: data,
        global: global,
        number: number,
        limit: limit,
    })
}

export async function llmCombine(keyword, columns, limit=30) {
    const loader = useLoader()
    return loader.post("combine", {
        keyword: keyword,
        columns: columns,
        limit: limit,
    })
}

export async function llmFree(prompt, limit=50) {
    const loader = useLoader()
    return loader.post("free", { prompt: prompt, limit: limit })
}

export async function llmFreeWithData(prompt, data, limit=50) {
    const loader = useLoader()
    return loader.post("free_data", { prompt: prompt, limit: limit, data: data  })
}