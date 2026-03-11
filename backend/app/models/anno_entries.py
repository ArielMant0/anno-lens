from app.utils import (
    fetchall,
    fetchone,
    insert_dict,
    insert_dict_many,
    update_dict,
    update_dict_many,
    delete_id,
    delete_id_many
)

from pypika import Table, Query


def exists(cur, id: str):
    return get_anno_entry(cur, id) is not None


def get_anno_entry(cur, id: str):
    entries = Table("anno_entries")
    q = Query.from_(entries).select("*").where(entries.id == id)
    return fetchone(cur, q.get_sql())


def get_anno_entries(cur, annotation=None):
    entries = Table("anno_entries")
    if annotation is not None:
        q = Query.from_(entries).select("*").where(entries.annotation_id == annotation)
        return fetchall(cur, q.get_sql())

    return fetchall(cur, Query.from_(entries).select("*").get_sql())


def add_anno_entry(cur, data: dict, return_field: str = "id"):
    if "text" not in data:
        data["text"] = None
        
    return insert_dict(
        cur,
        "anno_entries",
        ["annotation_id"],
        data,
        return_field
    )


def add_anno_entries(cur, data: list[dict]):
    for d in data:
        if "text" not in d:
            d["text"] = None

    return insert_dict_many(
        cur,
        "anno_entries",
        ["annotation_id", "text"],
        data
    )


def parse_column_entities(entities, entry_id):
    col_links = []
    
    for e in entities:
        # parse related column
        if e["type"] == "col":
            col_links.append({
                "anno_entry_id": entry_id,
                "column_id": e["data_id"],
                "value": e["value"]
            })
    
    return col_links


def parse_anno_entities(entities, entry_id):
    anno_links = []
    
    for e in entities:
        # parse related annotation
        if e["type"] == "anno":
            anno_links.append({
                "anno_entry_id": entry_id,
                "annotation_id": e["data_id"]
            })
    
    return anno_links


def update_anno_entry(cur, data: dict):
    return update_dict(cur, "anno_entries", ["updated_at"], data)


def update_anno_entries(cur, data: list[dict]):
    return update_dict_many(cur, "anno_entries", ["updated_at"], data)


def delete_anno_entry(cur, id: str):
    return delete_id(cur, "anno_entries", id)


def delete_anno_entries(cur, ids: list[str]):
    return delete_id_many(cur, "anno_entries", ids)