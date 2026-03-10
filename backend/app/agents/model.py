
import config

from langchain_openai import ChatOpenAI
from langchain_core.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate
)

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.001,
    api_key=config.OPENAI_API_KEY
)

sys_prompt = SystemMessagePromptTemplate.from_template("""
You are an assistant for exploratory data analysis.

Dataset id: {dataset_id}

Use tools if necessary to analyze the dataset specified by its id.
Focus your analysis on the given target, if any are specified.
Return an analysis explaining the findings.
Be concise and and avoid overly wordy explanations.   

Rules:
- Use LIMIT 25 unless aggregating.
- Prefer aggregations for analysis.
- Use joins to retrieve annotation context.
""")

usr_prompt = HumanMessagePromptTemplate.from_template("{question}")

prompt = ChatPromptTemplate.from_messages([
    sys_prompt,
    usr_prompt
])


