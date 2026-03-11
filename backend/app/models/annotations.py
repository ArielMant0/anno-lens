import app.models.groups as m_gr
import app.models.group_members as m_gm
import app.models.anno_anno_links as m_aal
import app.models.anno_column_links as m_acl
import app.models.anno_group_links as m_agl
import app.models.anno_entries as m_ae

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

from pypika import Tables, Query

def create_from_json(cur, data: dict):
    aid = data["id"]
    did = data["dataset_id"]

    if not exists(cur, aid):
        add_annotation(cur, data, "id")

        gid = data["group_id"]
        group_links = [{ "annotation_id": aid, "group_id": gid }]

        if not m_gr.exists(gid):
            m_gr.add_group(cur, { "id": gid, "dataset_id": did })
            m_gm.add_group_members(
                cur,
                [{ "group_id": gid, "item_id": d } for d in data["data"]]
            )

        # link this group to the annotation
        m_agl.add_anno_group_links(cur, group_links)

        # go through all entries
        for entry in data["entries"]:

            eid = m_ae.add_anno_entry(cur, { "annotation_id": aid }, "id")

            col_links = m_ae.parse_column_entities(entry["entities"], eid)
            anno_links = m_ae.parse_anno_entities(entry["entities"], eid)

            m_acl.add_anno_column_links(cur, col_links)
            m_aal.add_anno_anno_links(cur, anno_links)

        return True
    
    return False


def update_from_json(cur, data: dict):
    aid = data["id"]

    if exists(cur, aid):
        did = data["dataset_id"]
        gid = data["group_id"]

        if not m_gr.exists(gid):
            m_gr.add_group(cur, { "id": gid, "dataset_id": did })
            m_gm.add_group_members(
                cur,
                [{ "group_id": gid, "item_id": d } for d in data["data"]]
            )
        else:
            # update group members
            m_gr.update_group_members(cur, gid, data["data"])

        # link this group to the annotation
        if not m_agl.exists(cur, aid, gid):
            m_agl.add_anno_group_links(cur, [{ "annotation_id": aid, "group_id": gid }])

        # go through all entries
        for entry in data["entries"]:

            eid = entry["id"]
            if m_ae.exists(cur, eid):
                # TODO: update entry
                pass
            else:
                m_ae.add_anno_entry(cur, { "id": eid, "annotation_id": aid })

                col_links = m_ae.parse_column_entities(entry["entities"], eid)
                anno_links = m_ae.parse_anno_entities(entry["entities"], eid)

                m_acl.add_anno_column_links(cur, col_links)
                m_aal.add_anno_anno_links(cur, anno_links)

        return True
    
    return False


def exists(cur, id: int):
    return get_annotation(cur, id) is not None


def get_annotation(cur, id):
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

    q = q.where(annos.id == id)

    return fetchone(cur, q.get_sql())


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