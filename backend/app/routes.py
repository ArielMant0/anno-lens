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
model = ChatOpenAI(model="gpt-4o-mini", api_key=config.OPENAI_API_KEY)

class BasicAnswer(BaseModel):
    """A basic answer consisting of the answer text and a list of column names relevant to the answer."""
    answer: str = Field(description="The explanation")
    columns: List[str] = Field(description="The list of column names (may be empty)")


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


@bp.post('/free')
def free():
    if config.USE_DUMMY_DATA:
        return jsonify({ "answer": "free prompt answer" })

    template = request.json["prompt"]+" Only reply with the answer contents, nothing else."
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a data analyst."),
        ("human", template)
    ])
    agent = create_agent(
        model=model,
        response_format=BasicAnswer  # Auto-selects ProviderStrategy
    )
    chain = prompt | agent
    answer = chain.invoke()
    return jsonify({ "answer": answer["structured_response"].answer })


@bp.post('/free_data')
def free_with_data():
    if config.USE_DUMMY_DATA:
        return jsonify({ "answer": "free with data answer" })
    
    template = request.json["prompt"]+" Only reply with the answer contents, nothing else. Data: {data}"
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a data analyst."),
        ("human", template)
    ])

    agent = create_agent(
        model=model,
        response_format=BasicAnswer  # Auto-selects ProviderStrategy
    )

    chain = prompt | agent
    answer = chain.invoke({ "data": request.json["data"] })

    return jsonify({
        "answer": answer["structured_response"].answer,
        "columns": answer["structured_response"].columns
    })


@bp.post('/extract')
def extract():
    if config.USE_DUMMY_DATA:
        return jsonify({
            "answer": "extract columns answer",
            "columns": ["potassium", "protein"],
        })

    template = request.json["prompt"] + " Only reply with the answer contents, nothing else. Data subset: {data}. Global characteristics: {global}."

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a data analyst."),
        ("human", template)
    ])

    agent = create_agent(
        model=model,
        response_format=BasicAnswer  # Auto-selects ProviderStrategy
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
    if config.USE_DUMMY_DATA:
        return jsonify({
            "answer": "combination explanation",
            "columns": ["potassium", "protein"],
            "weights": { "potassium": 0.33, "protein": 0.66 }
        })
    
    template = request.json["prompt"] + " Only reply with the explanation and columns, nothing else."

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a data analyst."),
        ("human", template)
    ])

    agent = create_agent(
        model=model,
        response_format=ColumnLinearCombination  # Auto-selects ProviderStrategy
    )

    chain = prompt | agent
    answer = chain.invoke()

    return jsonify({
        "answer": answer["structured_response"].explanation,
        "columns": answer["structured_response"].columns,
        "weights": answer["structured_response"].weights
    })


@bp.post('/comparison')
def comparison():
    if config.USE_DUMMY_DATA:
        return jsonify({
            "answer": "comparison explanation",
            "columns": ["vitamins & minerals"]
        })
    
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
    answer = chain.invoke({ "data": request.json["data"] })

    return jsonify({
        "answer": answer["structured_response"].explanation,
        "columns": answer["structured_response"].columns
    })