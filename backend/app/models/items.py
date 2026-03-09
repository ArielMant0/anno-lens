from app.models.datasets import get_dataset_item_table
from app.utils import (
    fetchall,
    insert_dict,
    insert_dict_many
)

from pypika import Table, Query



def get_items(cur, dataset):
    table_name = get_dataset_item_table(cur, dataset)
    items = Table(table_name)
    return fetchall(
        cur,
        Query.from_(items).select("*").where(items.dataset_id == dataset).get_sql()
    )


def add_item(cur, dataset: int, data: dict, return_field: str = "id"):
    table_name = get_dataset_item_table(cur, dataset)
    return insert_dict(
        cur,
        table_name,
        list(data.keys()),
        data,
        return_field
    )


def add_items(cur, dataset: int, data: list[dict]):
    table_name = get_dataset_item_table(cur, dataset)
    return insert_dict_many(
        cur,
        table_name,
        list(data[0].keys()),
        data
    )