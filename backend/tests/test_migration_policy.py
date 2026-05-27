from __future__ import annotations

import ast
from pathlib import Path


MIGRATIONS_DIR = Path(__file__).resolve().parents[1] / "alembic" / "versions"


def _migration_files() -> list[Path]:
    return sorted(MIGRATIONS_DIR.glob("*.py"))


def _function_node(source: str, name: str) -> ast.FunctionDef | None:
    tree = ast.parse(source)
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name == name:
            return node
    return None


def _function_source(source: str, name: str) -> str:
    node = _function_node(source, name)
    return ast.get_source_segment(source, node) if node else ""


def _has_executable_body(node: ast.FunctionDef) -> bool:
    for statement in node.body:
        if isinstance(statement, ast.Expr) and isinstance(statement.value, ast.Constant):
            if statement.value.value is Ellipsis:
                continue
        if isinstance(statement, ast.Pass):
            continue
        return True
    return False


def test_migrations_have_working_downgrade_functions() -> None:
    for path in _migration_files():
        source = path.read_text()
        downgrade = _function_node(source, "downgrade")

        assert downgrade, f"{path.name} is missing downgrade()"
        assert _has_executable_body(downgrade), f"{path.name} has an empty downgrade()"


def test_upgrade_migrations_do_not_drop_schema_objects() -> None:
    for path in _migration_files():
        source = path.read_text()
        upgrade = _function_source(source, "upgrade")

        assert "op.drop_column" not in upgrade, f"{path.name} drops a column in upgrade()"
        assert "op.drop_table" not in upgrade, f"{path.name} drops a table in upgrade()"
