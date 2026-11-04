"""
Tiny startup migration.

Base.metadata.create_all() creates missing TABLES but never adds new
COLUMNS to tables that already exist (for example on your Neon database).
This adds the columns introduced after the first deployment. It is safe
to run on every start: a column is only added if it is missing.
"""

from sqlalchemy import inspect, text

# (table, column, SQL type)
NEW_COLUMNS = [
    ("attendance", "source", "VARCHAR DEFAULT 'qr'"),
    ("attendance", "check_out_source", "VARCHAR"),
    ("employees", "deleted_at", "TIMESTAMP"),
]


def ensure_columns(engine):
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as connection:
        for table, column, sql_type in NEW_COLUMNS:
            if table not in existing_tables:
                continue

            columns = {c["name"] for c in inspector.get_columns(table)}

            if column not in columns:
                connection.execute(
                    text(f'ALTER TABLE {table} ADD COLUMN {column} {sql_type}')
                )
