import json

from app import bp
from flask import Response, jsonify, request

from langchain_core.prompts import PromptTemplate
from langchain_ollama.llms import OllamaLLM

model = OllamaLLM(model="gemma3:4b")


@bp.post('/free')
def free():
    answer = model.invoke(request.prompt+". Only reply with the summary, nothing else.")
    return jsonify({ "answer": answer })


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
    return jsonify({ "answer": answer })


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
    return jsonify({ "answer": answer })


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
    return jsonify({ "answer": answer })