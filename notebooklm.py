#!/usr/bin/env python3
"""
notebooklm.py — Upload Kalakaarian project docs to a NotebookLM notebook.

Usage:
    python notebooklm.py upload          # upload all docs to notebook
    python notebooklm.py query "..."     # ask a question against the notebook
    python notebooklm.py list            # list sources in the notebook

Requires:
    pip install notebooklm python-dotenv

Auth: set GOOGLE_EMAIL and GOOGLE_PASSWORD in .env (or export them).
Notebook: set NOTEBOOKLM_NOTEBOOK_ID in .env, or one is created on first upload.
"""

import os
import sys
import pathlib
import json
from dotenv import load_dotenv

load_dotenv()

REPO_ROOT = pathlib.Path(__file__).parent

# Markdown docs to include as NotebookLM sources
DOC_PATHS = [
    REPO_ROOT / "CLAUDE.md",
    REPO_ROOT / "GEMINI.md",
    REPO_ROOT / "docs/API.md",
    REPO_ROOT / "docs/ARCHITECTURE.md",
    REPO_ROOT / "docs/CHANGELOG.md",
    REPO_ROOT / "client/CLAUDE.md",
    REPO_ROOT / "server/CLAUDE.md",
]

STATE_FILE = REPO_ROOT / ".notebooklm_state.json"

DEFAULT_NOTEBOOK_ID = "72fbc3d7-64d0-4282-a381-e91d3d50b990"


def _load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def _save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2))


def _get_client():
    try:
        from notebooklm import NotebookLM
    except ImportError:
        print("ERROR: notebooklm not installed. Run: pip install notebooklm python-dotenv")
        sys.exit(1)

    email = os.environ.get("GOOGLE_EMAIL")
    password = os.environ.get("GOOGLE_PASSWORD")
    if not email or not password:
        print("ERROR: Set GOOGLE_EMAIL and GOOGLE_PASSWORD in .env")
        sys.exit(1)

    return NotebookLM(email=email, password=password)


def _get_or_create_notebook(client, state: dict):
    notebook_id = os.environ.get("NOTEBOOKLM_NOTEBOOK_ID") or state.get("notebook_id") or DEFAULT_NOTEBOOK_ID
    if notebook_id:
        return client.get_notebook(notebook_id)

    print("Creating new notebook: Kalakaarian Codebase")
    notebook = client.create_notebook("Kalakaarian Codebase")
    state["notebook_id"] = notebook.id
    _save_state(state)
    print(f"  Created notebook id={notebook.id}")
    print(f"  Add NOTEBOOKLM_NOTEBOOK_ID={notebook.id} to .env to reuse it.")
    return notebook


def cmd_upload():
    state = _load_state()
    client = _get_client()
    notebook = _get_or_create_notebook(client, state)

    uploaded = state.get("uploaded_sources", [])
    for path in DOC_PATHS:
        if not path.exists():
            print(f"  skip (missing): {path.relative_to(REPO_ROOT)}")
            continue
        rel = str(path.relative_to(REPO_ROOT))
        if rel in uploaded:
            print(f"  skip (already uploaded): {rel}")
            continue
        print(f"  uploading: {rel}")
        notebook.add_source_text(path.read_text(), title=rel)
        uploaded.append(rel)

    state["uploaded_sources"] = uploaded
    _save_state(state)
    print("Done.")


def cmd_query(question: str):
    state = _load_state()
    client = _get_client()
    notebook = _get_or_create_notebook(client, state)

    print(f"Q: {question}\n")
    response = notebook.query(question)
    print(f"A: {response}")


def cmd_list():
    state = _load_state()
    client = _get_client()
    notebook = _get_or_create_notebook(client, state)

    sources = notebook.list_sources()
    if not sources:
        print("No sources in notebook.")
        return
    for s in sources:
        print(f"  - {s}")


def main():
    args = sys.argv[1:]
    if not args or args[0] == "upload":
        cmd_upload()
    elif args[0] == "query" and len(args) >= 2:
        cmd_query(" ".join(args[1:]))
    elif args[0] == "list":
        cmd_list()
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
