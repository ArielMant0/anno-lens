from app.utils import (
    fetchall,
    fetchone,
    insert_dict,
    insert_dict_many,
    delete_id,
    delete_id_many
)

from pypika import Table, Query


def exists(cur, id: int):
    groups = Table("groups")
    return fetchone(cur, Query.from_(groups).select("*").where(groups.id == id)) is not None


def get_group(cur, id):
    groups = Table("groups")
    return fetchone(cur, Query.from_(groups).select("*").where(groups.id == id).get_sql())


def get_groups(cur, dataset=None):
    groups = Table("groups")
    if dataset is not None:
        q = Query.from_(groups).select("*").where(groups.dataset_id == dataset)
        return fetchall(cur, q.get_sql())

    return fetchall(cur, Query.from_(groups).select("*").get_sql())


def add_group(cur, data: dict, return_field: str = "id"):
    return insert_dict(
        cur,
        "groups",
        ["dataset_id"],
        data,
        return_field
    )


def add_groups(cur, data: list[dict]):
    return insert_dict_many(
        cur,
        "groups",
        ["dataset_id"],
        data
    )


def delete_group(cur, id: int):
    return delete_id(cur, "groups", id)


def delete_groups(cur, ids: list[int]):
    return delete_id_many(cur, "groups", ids)