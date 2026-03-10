from app.extensions import db_ro
from app.models import m_col, m_it, m_gr, m_gm, m_anno
from app.utils import fetchall, fetchone

from langchain.tools import tool
from pandas import DataFrame
from pypika import Table, Query, Criterion


@tool
def get_schema() -> list[dict]:
    """Return the database schema."""
    
    results = fetchall(
        db_ro.cursor(),
        "SELECT table_name, column_name, data_type FROM information_schema.columns " + 
        "WHERE table_schema = 'public' ORDER BY table_name;"
    )

    tables = {}
    for r in results:
        tn = r["table_name"]
        cn = r["column_name"]
        dt = r["data_type"]

        if tn in tables:
            tables[tn].append({ "column_name": cn, "data_type": dt })
        else:
            tables[tn] = [{ "column_name": cn, "data_type": dt }]

    return [{ "table_name": k, "columns": v } for k, v in tables.items()]
    

@tool
def get_dataset_summary(dataset_id: int) -> dict:
    """Return summary statistics and metadata for the given dataset."""
    cur = db_ro.cursor()
    ds_table = Table("datasets")
    q = Query.from_(ds_table).select("*").where(ds_table.id == dataset_id)
    ds = fetchone(cur, q.get_sql())

    items = m_it.get_items(cur, dataset_id)
    columns = m_col.get_columns(cur, dataset_id)

    return {
        "name": ds["name"],
        "num_rows": len(items),
        "columns": columns
    }


@tool  
def get_desc_stats(dataset_id: int, column: str) -> dict:
    """
    Return descriptive statistics for a specific column for list of data points:
    min, max, mean, standard deviation, median, 25%-percentile, 50%-percentile, 75%-percentile.
    """
    df = DataFrame(m_it.get_items(db_ro.cursor(), dataset_id))
    return df[column].describe().to_dict()


@tool  
def get_columns(dataset_id: int) -> list[dict]:
    """
    Return the list of columns for a given dataset
    """
    return m_col.get_columns(db_ro.cursor(), dataset_id)


@tool  
def get_column_by_name(dataset_id: int, name: str) -> dict | None:
    """
    Return the column for a given dataset and name, if it exists
    """
    cur = db_ro.cursor()
    columns = Table("columns")
    q = Query.from_(columns).select("*").where(
        Criterion.all([
            columns.name.ilike(name),
            columns.dataset_id == dataset_id
        ])
    )
    return fetchone(cur, q.get_sql())


@tool  
def get_group(group_id: str) -> dict | None:
    """
    Return the group and its members (as ids) for the given group id if it exists
    """
    cur = db_ro.cursor()
    group = m_gr.get_group(cur, group_id)
    group["members"] = m_gm.get_group_members(cur, group_id)
    print(group)
    return group


@tool  
def get_annotation(annotation_id: str) -> dict | None:
    """
    Return the annotation for a given annotation_id id if it exists
    """
    cur = db_ro.cursor()
    return m_anno.get_annotation(cur, annotation_id)
    

@tool
def query_sql(query: str) -> list[dict]:
    """
    Execute SQL query on the database.
    Always LIMIT results unless aggregation is used.
    """
    return fetchall(db_ro.cursor(), query)

    
tools = [
    get_schema,
    get_dataset_summary,
    get_desc_stats,
    get_columns,
    get_group,
    get_annotation,
    query_sql,
]
tools_by_name = {tool.name: tool for tool in tools}