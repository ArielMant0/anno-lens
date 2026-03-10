import json

from langgraph.graph import StateGraph, START, END
from langchain.messages import ToolMessage

from typing import Literal

from app.agents.answer_types import (
    EDAAnswer,
    ColumnList,
    ColumnWeights,
    DataComparison,
    SummaryAnswer,
)
from app.agents.model import llm, make_prompt
from app.agents.state import EDAState
from app.agents.tools import tools, tools_by_name

given_output_msg = "Return the desired structured output."


def describe(dataset_id: int, question: str, targets: list, target_type: str):
    return ask_model_with_targets(
        dataset_id,
        question,
        targets,
        target_type,
        SummaryAnswer
    )


def compare(dataset_id: int, question: str, targets: list, target_type: str):
    return ask_model_with_targets(
        dataset_id,
        question,
        targets,
        target_type,
        DataComparison
    )


def combine(dataset_id: int, question: str, columns: list[str]):
    return ask_model_with_targets(
        dataset_id,
        question + " Weights should be between -1 and 1.",
        columns,
        "column",
        ColumnWeights
    )


def extract(dataset_id: int, question: str, targets: list, target_type: str):
    return ask_model_with_targets(
        dataset_id,
        question + " Ignore identifier columns like 'id' or 'name'.",
        targets,
        target_type,
        ColumnList
    )


def ask_model_with_targets(dataset_id: int, question: str, targets: list, target_type: str, answer_type = EDAAnswer):
    
    question += " Focus your analysis on these targets (type: {target_type}) provided as database IDs: {targets}"
    arguments = {
        "targets": targets,
        "target_type": target_type
    }
    return ask_model(dataset_id, question, arguments, answer_type)


def ask_model(dataset_id: int, question: str, arguments: dict = {}, answer_types = EDAAnswer):

    arguments["dataset_id"] = dataset_id

    tool_llm = llm.bind_tools(tools)
    struc_llm = llm.with_structured_output(answer_types, method="function_calling")

    def llm_call(state: EDAState):
        """LLM decides whether to call a tool or not"""

        return {
            "messages": state["messages"] + [tool_llm.invoke(state["messages"])],
            "llm_calls": state.get('llm_calls', 0) + 1
        }

    def tool_node(state: EDAState):
        """Performs the tool call"""

        result = []
        increase = 0
        num_calls = state.get('tool_calls', 0)

        if num_calls < 5:
            for tool_call in state["messages"][-1].tool_calls:
                tool = tools_by_name[tool_call["name"]]
                observation = tool.invoke(tool_call["args"])
                result.append(ToolMessage(
                    content=observation if type(observation) is str else json.dumps(observation),
                    tool_call_id=tool_call["id"]
                ))
        
            increase += 1

        return {
            "messages": result,
            "tool_calls": num_calls + increase
        }


    def structure_node(state: EDAState):
        """
        Produce fitting structured output based on analysis results
        """

        # analysis result from last step
        analysis = state["messages"][-1].content

        struc_prompt = f"""
User question:
{question}

Analysis:
{analysis}

{given_output_msg}
"""

        result = struc_llm.invoke(struc_prompt)

        return { "structured_answer": result }


    def should_continue(state: EDAState) -> Literal["tool_node", "structure_node"]:
        """
        Decide if we should continue the loop or go to structuring based upon whether the LLM made a tool call
        """

        messages = state["messages"]
        last_message = messages[-1]

        # If the LLM makes a tool call, then perform an action
        if last_message.tool_calls:
            return "tool_node"

        # Otherwise, we stop (reply to the user)
        return "structure_node"
    

    # Build workflow
    agent_builder = StateGraph(EDAState)

    # Add nodes
    agent_builder.add_node("llm_call", llm_call)
    agent_builder.add_node("tool_node", tool_node)
    agent_builder.add_node("structure_node", structure_node)

    # Add edges to connect nodes
    agent_builder.add_edge(START, "llm_call")
    agent_builder.add_edge("tool_node", "llm_call")
    agent_builder.add_conditional_edges(
        "llm_call",
        should_continue,
        ["tool_node", "structure_node"]
    )
    agent_builder.add_edge("structure_node", END)

    # Compile the agent
    agent = agent_builder.compile()

    # Invoke
    model_input = make_prompt(question).invoke(arguments)
    model_output = agent.invoke(model_input)

    return model_output["structured_answer"].dict()