from pydantic import BaseModel, Field
from typing import Literal, List, Union, Optional

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


class EDAAnswer(BaseModel):
    type: Literal["text", "hypothesis", "data_comparison", "column_list", "weighted_columns"]

    text: Optional[TextAnswer] = None
    hypothesis: Optional[Hypothesis] = None
    data_comparison: Optional[ColumnList] = None
    column_list: Optional[ColumnList] = None
    weighted_columns: Optional[WeightedColumns] = None

# EDAAnswer = Union[TextAnswer, Hypothesis, DataComparison, ColumnList, WeightedColumns]