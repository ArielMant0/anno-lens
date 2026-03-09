from app.utils import (
    fetchall,
    fetchone,
    insert_dict,
    insert_dict_many,
    delete_id,
    delete_id_many,
    update_dict,
    update_dict_many
)

from pypika import Tables, Table, Query


def exists(cur, id: int):
    annos = Table("annotations")
    return fetchone(cur, Query.from_(annos).select("*").where(annos.id == id)) is not None


def get_annotations(cur, dataset=None):
    annos, entries, glinks, clinks, alinks = Tables(
        "annotations",
        "anno_entries",
        "anno_group_links",
        "anno_column_links",
        "anno_anno_links",
    )

    q = Query.from_(annos) \
        .join(glinks).on(glinks.annotation_id == annos.id) \
        .join(entries).on(entries.annotation_id == annos.id) \
        .join(clinks).on(clinks.anno_entry_id == entries.id) \
        .join(alinks).on(alinks.anno_entry_id == entries.id) \
        .select("*")

    if dataset is not None:
        q = q.where(annos.dataset_id == dataset)

    return fetchall(cur, q.get_sql())


def add_annotation(cur, data: dict, return_field: str = "id"):
    return insert_dict(
        cur,
        "annotations",
        ["dataset_id", "author", "title"],
        data,
        return_field
    )


def add_annotations(cur, data: list[dict]):
    return insert_dict_many(
        cur,
        "annotations",
        ["dataset_id", "author", "title"],
        data,
    )

def delete_annotation(cur, id: str):
    return delete_id(cur, "annotations", id)


def delete_annotations(cur, ids: list[str]):
    return delete_id_many(cur, "annotations", ids)


def update_annotation(cur, data: dict):
    return update_dict(cur, "annotations", ["author", "title"], data)


def update_annotations(cur, data: list[dict]):
    return update_dict_many(cur, "annotations", ["author", "title"], data)