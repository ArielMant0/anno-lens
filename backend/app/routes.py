from app import bp
from flask import Response, jsonify, request

from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM

model = OllamaLLM(model="gemma3:4b")

@bp.post('/summarize')
def summarize():
    template = "Summarize the attached datapoints, focusing on {question}. Use no more than {limit} words."
    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | model
    return jsonify({ "answer": chain.invoke(request.json) })