from app.extensions import db_ro
from app.utils import fetchall

from langchain.tools import tool
from pandas import DataFrame

@tool
def query_dataset(sql: str) -> str:
    """
    Execute SQL query on the dataset.
    Always LIMIT results unless aggregation is used.
    """
    return fetchall(db_ro.cursor(), sql)

@tool
def get_schema() -> str:
    """Return the database schema."""
    
    return fetchall(
        db_ro.cursor(),
        "SELECT table_name, column_name, data_type FROM information_schema.columns"
    )
    
@tool  
def get_desc_stats(datapoints: list, column: str) -> dict:
    """
    Compute descriptive statistics for a specific column for list of data points:
    min, max, mean, standard deviation, median, 25%-percentile, 50%-percentile, 75%-percentile.
    """

    df = DataFrame(datapoints)
    return df[column].describe().to_dict()

Tools = [query_dataset, get_schema, get_desc_stats]