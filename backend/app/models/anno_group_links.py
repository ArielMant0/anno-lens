from app.utils import (
    fetchall,
    insert_dict,
    insert_dict_many,
    delete_id,
    delete_id_many
)

from pypika import Table, Query


def get_anno_group_links(cur, annotation=None):
    links = Table("anno_group_links")
    if annotation is not None:
        q = Query.from_(links).select("*").where(links.annotation_id == annotation)
        return fetchall(cur, q.get_sql())

    return fetchall(cur, Query.from_(links).select("*").get_sql())


def add_anno_group_link(cur, data: dict, return_field: str = "id"):
    return insert_dict(
        cur,
        "anno_group_links",
        ["annotation_id", "group_id"],
        data,
        return_field
    )


def add_anno_group_links(cur, data: list[dict]):
    return insert_dict_many(
        cur,
        "anno_group_links",
        ["annotation_id", "group_id"],
        data
    )


def delete_anno_group_link(cur, id: int):
    return delete_id(cur, "anno_group_links", id)


def delete_anno_group_links(cur, ids: list[int]):
    return delete_id_many(cur, "anno_group_links", ids)