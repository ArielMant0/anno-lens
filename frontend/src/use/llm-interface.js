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

export async function llmExtract(keyword, data, global, limit=5) {
    const loader = useLoader()
    return loader.post("extract", { keyword: keyword, global: global, limit: limit, data: data })
}

export async function llmFree(prompt) {
    const loader = useLoader()
    return loader.post("free", { prompt: prompt })
}