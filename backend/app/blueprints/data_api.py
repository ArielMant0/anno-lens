from app.extensions import db
from app.utils import fetchall

from flask import Blueprint, jsonify, request, Response
from pypika import Table, Query

import app.models as models

ds_bp = Blueprint("data", __name__)
cur = db.cursor()

#########################################################################
## Get data
#########################################################################

@ds_bp.get("/datasets")
def get_datasets() -> Response:
    return jsonify(models.m_ds.get_datasets(cur))


@ds_bp.get("/<int:dataset>/items")
def get_items(dataset) -> Response:
    return jsonify(models.m_it.get_items(cur, dataset))


@ds_bp.get("/<int:dataset>/groups")
def get_groups(dataset) -> Response:
    return jsonify(models.m_gr.get_groups(cur, dataset))


@ds_bp.get("/<int:dataset>/columns")
def get_columns(dataset) -> Response:
    return jsonify(models.m_col.get_columns(cur, dataset))


@ds_bp.get("/<int:dataset>/annotations")
def get_annotations(dataset) -> Response:
    return jsonify(models.m_anno.get_annotations(cur, dataset))


#########################################################################
## Create data
#########################################################################

@ds_bp.post("/create/annotation")
def create_annotation() -> Response:

    data = request.json

    aid = models.m_anno.add_annotation(cur, data, "id")

    group_links = []
    # get all related groups for this annotation
    for g in data["groups"]:
        group_links.append({ "annotation_id": aid, "group_id": g["id"] })

    models.m_agl.add_anno_group_links(cur, group_links)

    # go through all entries
    for entry in data["entries"]:

        eid = models.m_ae.add_anno_entry(cur, { "annotation_id": aid }, "id")

        col_links = models.m_ae.parse_column_entities(entry["entities"], eid)
        anno_links = models.m_ae.parse_anno_entities(entry["entities"], eid)

        models.m_acl.add_anno_column_links(cur, col_links)
        models.m_aal.add_anno_anno_links(cur, anno_links)

    db.commit()

    return Response("TODO", status=200)


@ds_bp.post("/create/annotation_entry")
def create_annotation_entry() -> Response:
    data = request.json

    eid = models.m_ae.add_anno_entry(cur, data, "id")

    col_links = []
    anno_links = []
    
    col_links = models.m_ae.parse_column_entities(data["entities"], eid)
    anno_links = models.m_ae.parse_anno_entities(data["entities"], eid)

    models.m_acl.add_anno_column_links(cur, col_links)
    models.m_aal.add_anno_anno_links(cur, anno_links)

    db.commit()

    return Response("TODO", status=200)


@ds_bp.post("/create/group")
def create_group() -> Response:
    data = request.json

    # add group
    gid = models.m_gr.add_group(cur, { "dataset_id": data["dataset_id"] })
    # add members to groups
    models.m_gm.add_group_members(
        cur,
        [{ "group_id": gid, "item_id": d } for d in data["ids"]]
    )

    db.commit()

    return Response("TODO", status=200)


#########################################################################
## Update data
#########################################################################

@ds_bp.post("/update/annotation")
def update_annotation() -> Response:
    return Response("TODO", status=200)


@ds_bp.post("/update/group")
def update_group() -> Response:
    data = request.json

    # get group id
    gid = data["group_id"]
    # get members in database
    tmp = models.m_gm.get_group_members(cur, gid)
    if tmp is not None:
        existing = set([member["id"] for member in tmp])
        current = set(data["ids"])

        to_del = existing.difference(current)
        if len(to_del) > 0:
            # delete old group members
            models.m_gm.delete_group_members(cur, list(to_del))

        to_add = current.difference(existing)
        if len(to_add) > 0:
            # add new group members
            models.m_gm.add_group_members(
                cur,
                [{ "group_id": gid, "item_id": d } for d in to_add]
            )

    db.commit()

    return Response("TODO", status=200)


#########################################################################
## Delete data
#########################################################################

@ds_bp.post("/delete/annotation")
def delete_annotation() -> Response:
    data = request.json
    # delete this annotation
    models.m_anno.delete_annotation(cur, data["id"])
    
    db.commit()

    return Response("TODO", status=200)


@ds_bp.post("/delete/anno_entry")
def delete_anno_entry() -> Response:
    data = request.json
    # delete this annotation entry
    models.m_ae.delete_anno_entry(cur, data["id"])
    
    db.commit()

    return Response("TODO", status=200)


@ds_bp.post("/delete/anno_column_link")
def delete_anno_column_link() -> Response:
    data = request.json
    # delete this entry column link
    models.m_acl.delete_anno_column_link(cur, data["id"])
    
    db.commit()

    return Response("TODO", status=200)


@ds_bp.post("/delete/anno_anno_link")
def delete_anno_anno_link() -> Response:
    data = request.json
    # delete this entry annotation link
    models.m_aal.delete_anno_anno_link(cur, data["id"])
    
    db.commit()

    return Response("TODO", status=200)


@ds_bp.post("/delete/group")
def delete_group() -> Response:
    data = request.json
    # delete this group
    models.m_gr.delete_group(cur, data["id"])
    
    db.commit()

    return Response("TODO", status=200)


@ds_bp.post("/delete/anno_group_link")
def delete_anno_group_link() -> Response:
    data = request.json
    # delete this group link
    models.m_agl.delete_anno_group_link(cur, data["id"])
    
    db.commit()

    return Response("TODO", status=200)
    
