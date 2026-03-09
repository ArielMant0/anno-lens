from app.agents.tools import Tools
from app.agents.answer_types import (
    AnswerType,
    DataComparison,
    WeightedColumns,
    ColumnList
)
from app.agents.model import llm, make_prompt

from langchain.agents import create_agent

agent = create_agent(llm, tools=Tools)

def compare(question, targets, target_type):
    return run_with_targets(question, targets, target_type, [DataComparison])


def combine(question, columns):
    human = question + "  Weights should be between -1 and 1. Columns: {columns}"
    return run_with_targets(human, columns, "column", [WeightedColumns])


def extract(question, targets, target_type):
    return run_with_targets(
        question + "  Ignore identifier columns like 'id' or 'name'.",
        targets,
        target_type,
        [ColumnList]
    )


def analyze_single(question, context, answer_type):
    structured_llm = llm.with_structured_output(answer_type)
    return structured_llm.invoke(f"""
User question: {question}

SQL analysis results:
{context}

Produce the final structured result.
""")


def analyze_multiple(question, context, answer_types):
    structured_llm = llm.with_structured_output(answer_types)
    return structured_llm.invoke(f"""
User question: {question}

SQL analysis results:
{context}

Choose the best output format and produce the final structured result.
""")


def run_with_targets(question, targets, target_types, answer_types=None):
    
    # default: only pass text prompt
    arguments = {
        "question": question + " Target ids (type: {target_type}): {targets}",
        "targets": targets,
        "target_types": target_types
    }

    return _run_prompt(question, arguments, answer_types)


def run(question, arguments=None, answer_types=None):
    
    # default: only pass text prompt
    if arguments == None:
        arguments = {}

    # add question to arguments object
    arguments["question"] = question

    return _run_prompt(question, arguments, answer_types)


def _run_prompt(question, arguments, answer_types=None):

    # create the prompt
    prompt = make_prompt(arguments)

    # get tool result
    tool_result = agent.invoke(prompt)

    # default: make LLM choose the right answer
    if answer_types == None:
        # analyze tool results
        result = analyze_multiple(question, tool_result, AnswerType)
    else:
        result = analyze_single(question, tool_result, answer_types)

    return result