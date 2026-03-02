import { useLoader } from "./loader";
import { PromptTemplate, PromptVariable } from "./prompt-template";


/**
 * Asks the model something without any relation to data
 * @param {String} prompt prompt send to model
 * @returns
 */
export async function llmFree(prompt) {
    const loader = useLoader()
    console.debug("free/", prompt)
    return loader.post("free", { prompt: prompt })
}

/**
 * Asks the model something for a given set of data points
 * @param {String} prompt prompt send to model
 * @param {Array} data list of data points for the chosen subset
 * @returns
 */
export async function llmFreeWithData(prompt, data, text=null) {
    const loader = useLoader()
    console.debug("free_data/", prompt)
    return loader.post("free_data", { prompt: prompt, data: data, text: text })
}

/**
 * Asks the model something for a given text
 * @param {String} prompt prompt send to model
 * @param {String} text text that the model should do sth with
 * @returns
 */
export async function llmFreeWithText(prompt, text) {
    const loader = useLoader()
    console.debug("free_text/", prompt)
    return loader.post("free_text", { prompt: prompt, text: text })
}

/**
 * Compare a number of data subsets to each other
 * @param {String} prompt prompt send to model
 * @param {Object} data object containing data points for named subsets
 * @returns
 */
export async function llmComparison(prompt, data) {
    const loader = useLoader()
    console.debug("comparison/", prompt)
    return loader.post("comparison", { prompt: prompt, data: data })
}

/**
 *
 * @param {String} prompt prompt send to model
 * @param {Array} data list of data points for the chosen subset
 * @param {Array} global list of column statistics for all data
 * @returns
 */
export async function llmExtract(prompt, data, global) {
    const loader = useLoader()
    console.debug("extract/", prompt)
    return loader.post("extract", {
        prompt: prompt,
        data: data,
        global: global
    })
}

export async function llmCombine(prompt, columns) {
    const loader = useLoader()
    console.debug("combine/", prompt)
    return loader.post("combine", {
        prompt: prompt,
        columns: columns,
    })
}

///////////////////////////////////////////////////////////////////////////////////////
/// Default prompt templates
///////////////////////////////////////////////////////////////////////////////////////

export const SUMMARY_PROMPT = new PromptTemplate(
    "Summarize the most important characteristics of the data using no more than :limit: words.",
    [new PromptVariable("limit", 50, "integer")]
)

export const DESCRIPTION_PROMPT = new PromptTemplate(
    "Describe notable characteristics of the data using no more than :limit: words.",
    [new PromptVariable("limit", 50, "integer")]
)

export const LABEL_PROMPT = new PromptTemplate(
    "Provide a fitting label for these data points using no more than :limit: words.",
    [new PromptVariable("limit", 5, "integer")]
)

export const EXTRACT_PROMPT = new PromptTemplate(
    "Extract up to :number: columns for which the data subset could be described as :keyword: compared to the global dataset. Explain what makes them :keyword: using no more than :limit: words.",
    [new PromptVariable("number", 3, "integer"), new PromptVariable("keyword", "different"), new PromptVariable("limit", 100, "integer")]
)

export const COMPARE_PROMPT = new PromptTemplate(
    "Compare the the following data subsets, focus on :keyword:. Explain your choice using no more than :limit: words.",
    [new PromptVariable("keyword", "differences"), new PromptVariable("limit", 100, "integer")]
)

export const COMBINE_PROMPT = new PromptTemplate(
    "Provide a weighted linear combination of the following columns to indicate :keyword:. Explain your choice using no more than :limit: words.",
    [new PromptVariable("keyword", "healthy cereal options"), new PromptVariable("limit", 100, "integer")]
)

export const REFINE_PROMPT = new PromptTemplate(
    "Improve the given text, aiming for :keyword:. Use no more than :limit: words.",
    [new PromptVariable("keyword", "clear and concise writing"), new PromptVariable("limit", 100, "integer")]
)