
import config

from langchain_openai import ChatOpenAI
from langchain_core.prompts.chat import ChatPromptTemplate

llm = ChatOpenAI(
    model="gpt-5-nano",
    temperature=0.0,
    api_key=config.OPENAI_API_KEY
)

sys_prompt = """
You are an assistant for exploratory data analysis.

Dataset id: {dataset_id}

Use tools if necessary to analyze the dataset with respect to the user's question.
Return an analysis that explains your findings.
Be concise and and avoid overly wordy explanations.   

Rules:
- Use LIMIT 25 unless aggregating.
- Prefer aggregations for analysis.
"""

def make_prompt(user_question: str):
    return ChatPromptTemplate([
        ("system", sys_prompt),
        ("human", user_question)
    ])


