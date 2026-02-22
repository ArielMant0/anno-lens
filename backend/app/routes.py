import json
import config

from app import bp
from flask import Response, jsonify, request
from typing import List

from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain.agents import create_agent
# from langchain_ollama.llms import OllamaLLM
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

# model = OllamaLLM(model="gemma3:4b")
model = ChatOpenAI(model="gpt-4.1-mini", api_key=config.OPENAI_API_KEY)


class DataComparisonResult(BaseModel):
    """A list of relevant columns for tabular data and an explanation of the comparison between datasets."""
    explanation: str = Field(description="The explanation")
    columns: List[str] = Field(description="The list of column names")

class ColumnExtraction(BaseModel):
    """A list of columns for tabular data and an explanation for their choice."""
    explanation: str = Field(description="The explanation")
    columns: List[str] = Field(description="The list of column names")


class ColumnLinearCombination(BaseModel):
    """A list of weighted columns for tabular data and an explanation for their choice."""
    explanation: str = Field(description="The explanation")
    columns: List[str] = Field(description="The list of column names")
    weights: dict = Field(description="The dictionary containing weights for selected columns")


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
    template = request.json["prompt"]+" Only reply with the answer contents, nothing else."
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a data analyst."),
        ("human", template)
    ])
    chain = prompt | model
    answer = chain.invoke()
    return jsonify({ "answer": answer.content })


@bp.post('/free_data')
def free_with_data():
    template = request.json["prompt"]+" Only reply with the answer contents, nothing else. Data: {data}"
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a data analyst."),
        ("human", template)
    ])

    chain = prompt | model
    answer = chain.invoke({ "data": request.json["data"] })
    return jsonify({ "answer": answer.content })


@bp.post('/extract')
def extract():
    template = request.json["prompt"]+" Only reply with the column names and explanation, nothing else. Data subset: {data}. Global characteristics: {global}."

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a data analyst."),
        ("human", template)
    ])

    agent = create_agent(
        model=model,
        response_format=ColumnExtraction  # Auto-selects ProviderStrategy
    )

    chain = prompt | agent
    answer = chain.invoke({
        "data": request.json["data"],
        "global": request.json["global"]
    })

    return jsonify({
        "answer": answer["structured_response"].explanation,
        "columns": answer["structured_response"].columns
    })


@bp.post('/combine')
def combine():
    template = "Provide a linear combination of columns from the data subset that represents {keyword} data points. Explain your choice using no more than {limit} words."

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a data analyst."),
        ("human", template)
    ])

    agent = create_agent(
        model=model,
        response_format=ColumnLinearCombination  # Auto-selects ProviderStrategy
    )

    chain = prompt | agent
    answer = chain.invoke({
        "limit": request.json["limit"],
        "keyword": request.json["keyword"]
    })

    return jsonify({
        "answer": answer["structured_response"].explanation,
        "columns": answer["structured_response"].columns,
        "weights": answer["structured_response"].weights
    })


@bp.post('/summary')
def summary():
    template = "Summarize important characteristics of the data using no more than {limit} words. Data: {data}. Only reply with the summary, nothing else."
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a data analyst."),
        ("human", template)
    ])
    chain = prompt | model
    answer = chain.invoke({
        "data": request.json["data"],
        "limit": request.json["limit"]
    })
    return jsonify({ "answer": answer.content })


@bp.post('/summaryfunction')
def summaryfunction():
    # TODO: adapt this prompt to return a structured linear combination of columns
    template = "Summarize the following data (passed as JSON) using no more than {limit} words: {data}."
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a data analyst."),
        ("human", template)
    ])
    chain = prompt | model
    answer = chain.invoke({
        "data": request.json["data"],
        "limit": request.json["limit"]
    })
    return jsonify({ "answer": answer.content })


@bp.post('/comparison')
def comparison():
    template = request.json["prompt"] + " Data subsets: {data}"
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a data analyst."),
        ("human", template)
    ])

    agent = create_agent(
        model=model,
        response_format=DataComparisonResult  # Auto-selects ProviderStrategy
    )

    chain = prompt | agent
    answer = chain.invoke({
        "data": request.json["data"],
        "global": request.json["global"]
    })

    return jsonify({
        "answer": answer["structured_response"].explanation,
        "columns": answer["structured_response"].columns
    })