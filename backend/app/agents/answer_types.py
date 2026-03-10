from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Literal, List

from langchain_core.utils.json_schema import dereference_refs

class CustomBaseModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid"   # This will add "additionalProperties": false to the json_schema by default
    )   

    @classmethod
    def model_json_schema(cls, *args, **kwargs) -> dict[str, Any]:
        json_schema = super().model_json_schema(*args, **kwargs)
        json_schema = dereference_refs(json_schema)   # This will dereference $refs
        if "$defs" in json_schema:
            json_schema.pop("$defs", None)   # Remove $defs after dereferencing
        return json_schema
    
    
class TextAnswer(CustomBaseModel):
    """
    An answer consisting only of the answer text.
    """
    answer: str = Field(description="The answer formatted as markdown")


class Hypothesis(CustomBaseModel):
    """
    A hypothesis and a list of evidence that supports it.
    """
    answer: str = Field(description="The answer formatted as markdown")
    evidence: List[str] = Field(description="The list of supporting evidence")


class DataComparison(CustomBaseModel):
    """
    An explanation of the comparison between the given entities and a list
    of column names relevant to the explanation.
    """
    answer: str = Field(description="The explanation formatted as markdown")
    columns: List[str] = Field(description="The list of relevant column names")


class ColumnList(CustomBaseModel):
    """
    A list of columns identified as relevant and an explanation for their choice.
    """
    answer: str = Field(description="The explanation formatted as markdown")
    columns: List[str] = Field(description="The list of relevant column names")


class WeightedColumns(CustomBaseModel):
    """
    A list of weighted columns for the given tabular data and an
    explanation for their choice.
    """
    answer: str = Field(description="The explanation formatted as markdown")
    weights: dict = Field(description="A dictionary containing weights for all columns using their names as keys")


class EDAAnswer(CustomBaseModel):
    answer: str = Field(description="The answer text formatted as markdown")

    columns: List[int] = Field([], description="A list of column ids relevant for the answer")
    columns_weights: dict = Field({}, description="Weights for columns by id, if necessary")

    groups: List[str] = Field([], description="A list of group ids relevant for the answer")
    annotations: List[str] = Field([], description="A list of annotation ids relevant for the answer")

    evidence: List[str] = Field([], description="Additional supporting evidence")

