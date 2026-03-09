
import config

from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain.messages import SystemMessage

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
    api_key=config.OPENAI_API_KEY
)

sys_prompt = SystemMessage("""
You are a data analysis assistant.

You can query a SQL dataset that contains:

- items
- columns
- groups
- group_members
- annotations
- anno_group_links
- anno_entries
- anno_entry_links
- entities
     
Each dataset refers to a separate table via table_name where the data
with all column values is stored.

Annotations are made up of
- 0 or more groups referenced via anno_group_links
- 1 or more annotation entries referenced via anno_entries
     
Anotation entries may reference entities via anno_entry_links.

Workflow:

1. Inspect schema if needed.
2. Query dataset using SQL if needed.
3. Analyze results.
4. Produce a structured answer.

Rules:
- Use LIMIT 50 unless aggregating.
- Prefer aggregations for analysis.
- Use joins to retrieve annotation context.
""")

usr_prompt = HumanMessagePromptTemplate.from_template("{question}") 

prompt = ChatPromptTemplate.from_messages([sys_prompt, usr_prompt])