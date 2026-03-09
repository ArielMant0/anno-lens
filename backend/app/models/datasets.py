from app.utils import (
    fetchall,
    fetchone,
    insert_dict,
    insert_dict_many
)


from pypika import Table, Query


def get_datasets(cur):
    return fetchall(cur, Query.from_("datasets").select("*").get_sql())


def get_dataset_item_table(cur, dataset):
    ds = Table("datasets")
    return fetchone(
        cur,
        Query.from_(ds).select("table_name").where(ds.id == dataset).get_sql()
    )["table_name"]


def add_dataset(cur, data: dict, return_field: str = "id"):
    return insert_dict(
        cur,
        "datasets",
        ["name", "table_name"],
        data,
        return_field
    )


def add_datasets(cur, data: list[dict]):
    return insert_dict_many(
        cur,
        "datasets",
        ["name", "table_name"],
        data
    )
