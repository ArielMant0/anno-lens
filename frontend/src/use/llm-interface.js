import { useLoader } from "./loader";
import { PromptTemplate, PromptVariable } from "./prompt-template";

export async function llmSummary(data) {
    const loader = useLoader()
    return loader.post("summary", { limit: limit, data: data })
}

/**
 * Compare a number of data subsets to each other
 * @param {Object} data 
 * @returns 
 */
export async function llmComparison(prompt, data) {
    const loader = useLoader()
    return loader.post("comparison", { prompt: prompt, data: data })
}

export async function llmSummaryFunction(data) {
    const loader = useLoader()
    return loader.post("summaryfunction", { limit: limit, data: data })
}

export async function llmExtract(prompt, data, global) {
    const loader = useLoader()
    return loader.post("extract", {
        prompt: prompt,
        data: data,
        global: global
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

export async function llmFree(prompt) {
    const loader = useLoader()
    return loader.post("free", { prompt: prompt})
}

export async function llmFreeWithData(prompt, data) {
    const loader = useLoader()
    return loader.post("free_data", { prompt: prompt, data: data })
}

export const SUMMARY_PROMPT = new PromptTemplate(
    "Summarize important characteristics of the data using no more than :limit: words.",
    [new PromptVariable("limit", 50, "integer")]
)

export const LABEL_PROMPT = new PromptTemplate(
    "Provide a fitting label for these data points using no more than :limit: words.",
    [new PromptVariable("limit", 5, "integer")]
)

export const EXTRACT_PROMPT = new PromptTemplate(
    "Extract :number: columns from the data subset that could be described as :keyword: relative to the global dataset characteristics. Explain your choice using no more than :limit: words.",
    [new PromptVariable("number", 5, "integer"), new PromptVariable("keyword", "unique"), new PromptVariable("limit", 50, "integer")]
)

export const COMPARE_PROMPT = new PromptTemplate(
    "Compare the the following data subsets, focus on :keyword:. Explain your choice using no more than :limit: words.",
    [new PromptVariable("keyword", "differences"), new PromptVariable("limit", 50, "integer")]
)