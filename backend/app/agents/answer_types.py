from pydantic import BaseModel, Field
from typing import Literal, List

class TextAnswer(BaseModel):
    """
    An answer consisting only of the answer text.
    """
    type: Literal["text"]
    answer: str = Field(description="The answer formatted as markdown")


class Hypothesis(BaseModel):
    """
    A hypothesis and a list of evidence that supports it.
    """
    type: Literal["hypothesis"]
    answer: str = Field(description="The answer formatted as markdown")
    evidence: List[str] = Field(description="The list of supporting evidence")


class DataComparison(BaseModel):
    """
    An explanation of the comparison between the given entities and a list
    of column names relevant to the explanation.
    """
    type: Literal["data_comparison"]
    explanation: str = Field(description="The explanation formatted as markdown")
    columns: List[str] = Field(description="The list of relevant column names")


class ColumnList(BaseModel):
    """
    A list of columns identified as relevant and an explanation for their choice.
    """
    type: Literal["column_list"]
    explanation: str = Field(description="The explanation formatted as markdown")
    columns: List[str] = Field(description="The list of relevant column names")


class WeightedColumns(BaseModel):
    """
    A list of weighted columns for the given tabular data and an
    explanation for their choice.
    """
    type: Literal["weighted_columns"]
    explanation: str = Field(description="The explanation formatted as markdown")
    weights: dict = Field(description="A dictionary containing weights for all columns using their names as keys")


AnswerType = TextAnswer | Hypothesis | DataComparison | ColumnList | WeightedColumns