from pypika import Table, Query

def make_sql_params(list, template="%s"):
    return ",".join([template for _ in list])


def make_dict_params(fields):
    params = ""
    for f in fields:
        params += f"%({f})s"
    return params


def fetchone(conn, query: str):
    return conn.execute(query).fetchone()


def fetchall(conn, query: str):
    return conn.execute(query).fetchall()


def fetchall_params(conn, query: str, params):
    return conn.execute(query, params).fetchall()


def run(conn, query: str, params=None):
    if params is None:
        return conn.execute(query)
    return conn.execute(query, params)


def run_many(conn, query: str, params):
    return conn.executemany(query, params)


def insert_values(conn, table: str, fields: list[str], data: list, return_field=None):
    q = Query.into(table).columns(fields)
    
    if return_field is not None:
        return fetchone(
            conn,
            q.get_sql()+f" VALUES ({','.join(make_sql_params(fields))}) RETURNING {return_field}",
            data
        )[return_field]
    
    return run(
        conn,
        q.get_sql()+f" VALUES ({','.join(make_sql_params(fields))})",
        data
    )


def insert_values_many(conn, table: str, fields: list[str], data: list[list]):
    q = Query.into(table).columns(fields)
    return run_many(
        conn,
        q.get_sql()+f" VALUES ({','.join(make_sql_params(fields))})",
        data
    )


def insert_dict(conn, table: str, fields: list[str], data: dict, return_field=None):
    q = Query.into(table).columns(fields)
    
    if return_field is not None:
        result = fetchone(
            conn,
            q.get_sql()+f" VALUES ({','.join(make_dict_params(fields))}) RETURNING {return_field}",
            data
        )
        return None if result is None else result [return_field]
    
    return run(
        conn,
        q.get_sql()+f" VALUES ({','.join(make_dict_params(fields))})",
        data
    )


def insert_dict_many(conn, table: str, fields: list[str], data: list[dict]):
    q = Query.into(table).columns(fields)
    return run_many(
        conn,
        q.get_sql()+f" VALUES ({','.join(make_dict_params(fields))})",
        data
    )


def delete_id(conn, table: str, id):
    t = Table(table)
    return run(conn, Query.from_(t).delete().where(t.id == id).get_sql())


def delete_id_many(conn, table: str, ids: list):
    t = Table(table)
    return run(conn, Query.from_(t).delete().where(t.id.isin(ids)).get_sql())


def update_dict(conn, table: str, fields: list[str], data: dict):
    t = Table(table)
    q = Query.update(t)
    
    # for each field, set current value
    for f in fields:
        q = q.set(f, data[f])

    # limit to only this row
    q = q.where(t.id == data["id"])
    
    return run(conn, q.get_sql())


def update_dict_many(conn, table: str, fields: list[str], data: list[dict]):
    for d in data:
        update_dict(conn, table, fields, d)
    return conn
