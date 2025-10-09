import json
import config

from app import bp
from flask import Response, jsonify, request
from typing import List

from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.prompts import PromptTemplate
from langchain.agents import create_agent
from langchain_ollama.llms import OllamaLLM
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

# model = OllamaLLM(model="gemma3:4b")
model = ChatOpenAI(model="gpt-4.1-mini", api_key=config.OPENAI_API_KEY)


class ColumnList(BaseModel):
    """A list of columns for tabular data."""
    columns: List[str] = Field(description="The list of column names")


class ColDescRetriever(BaseRetriever):
    """A column retriever that contains the top k documents that match the user query.

    This retriever only implements the sync method _get_relevant_documents.

    If the retriever were to involve file access or network access, it could benefit
    from a native async implementation of `_aget_relevant_documents`.

    As usual, with Runnables, there's a default async implementation that's provided
    that delegates to the sync implementation running on another thread.
    """

    documents: List[Document]
    """List of documents to retrieve from."""
    k: int
    """Number of top results to return"""

    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        """Sync implementations for retriever."""
        matching_docs = []
        for document in self.documents:
            if len(matching_docs) > self.k:
                return matching_docs

            if query.lower() in document.page_content.lower():
                matching_docs.append(document.page_content)
        return matching_docs


@bp.post('/free')
def free():
    answer = model.invoke(request.prompt+". Only reply with the answer contents, nothing else.")
    return jsonify({ "answer": answer.content })


@bp.post('/extract')
def extract():
    template = "Extract {limit} columns from the data subset that could be described as {keyword} relative to the global dataset characteristics. Subset: {data}. Global characteristics: {global}. Only reply with the column names and an explanation, nothing else."
    prompt = PromptTemplate(
        input_variables=["limit", "data", "keyword", "global"],
        template=template
    )
    formatted_data = json.dumps(request.json["data"], indent=2)
    formatted_global = json.dumps(request.json["global"], indent=2)

    agent = create_agent(
        model=model,
        response_format=ColumnList  # Auto-selects ProviderStrategy
    )

    chain = prompt | agent
    answer = chain.invoke({
        "data": formatted_data,
        "global": formatted_global,
        "limit": request.json["limit"],
        "keyword": request.json["keyword"]
    })
    print(answer.structured_response)
    return jsonify({ "answer": answer.structured_response.columns })


@bp.post('/summary')
def summary():
    template = "Summarize the following data (passed as JSON) using no more than {limit} words: {data}. Only reply with the summary, nothing else."
    prompt = PromptTemplate(
        input_variables=["limit", "data"],
        template=template
    )
    formatted_data = json.dumps(request.json["data"], indent=2)
    chain = prompt | model
    answer = chain.invoke({
        "data": formatted_data,
        "limit": request.json["limit"]
    })
    return jsonify({ "answer": answer.content })


@bp.post('/summaryfunction')
def summaryfunction():
    # TODO: adapt this prompt to return a structured linear combination of columns
    template = "Summarize the following data (passed as JSON) using no more than {limit} words: {data}."
    prompt = PromptTemplate(
        input_variables=["limit", "data"],
        template=template
    )
    formatted_data = json.dumps(request.json["data"], indent=2)
    chain = prompt | model
    answer = chain.invoke({
        "data": formatted_data,
        "limit": request.json["limit"]
    })
    return jsonify({ "answer": answer.content })


@bp.post('/comparison')
def comparison():
    template = "Summarize the differences between the following two sets of data (passed as JSON) using no more than {limit} words. Primary: {dataA}. Secondary: {dataB}. Only reply with the differences, nothing else."
    prompt = PromptTemplate(
        input_variables=["limit", "dataA", "dataB"],
        template=template
    )
    dataA = json.dumps(request.json["dataA"], indent=2)
    dataB = json.dumps(request.json["dataB"], indent=2)
    chain = prompt | model
    answer = chain.invoke({
        "dataA": dataA,
        "dataB": dataB,
        "limit": request.json["limit"]
    })
    return jsonify({ "answer": answer.content })