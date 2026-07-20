import os
import sqlite3
import json
import logging
import asyncio
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from app.config import settings

logger = logging.getLogger("choice_tailors")
logging.basicConfig(level=logging.INFO)

class SQLiteCollection:
    def __init__(self, db_path: str, collection_name: str):
        self.db_path = db_path
        self.name = collection_name
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                collection_name TEXT,
                id TEXT,
                data TEXT,
                PRIMARY KEY (collection_name, id)
            )
            """
        )
        conn.commit()
        conn.close()

    def _clean_doc(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        if "id" in doc and "_id" not in doc:
            doc["_id"] = doc["id"]
        return doc

    async def insert_one(self, document: Dict[str, Any]) -> Any:
        doc = dict(document)
        if "_id" not in doc:
            doc["_id"] = str(ObjectId())
        elif isinstance(doc["_id"], ObjectId):
            doc["_id"] = str(doc["_id"])
        
        doc_id = doc["_id"]
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO documents VALUES (?, ?, ?)",
            (self.name, doc_id, json.dumps(doc)),
        )
        conn.commit()
        conn.close()
        
        class InsertResult:
            inserted_id = doc_id
        return InsertResult()

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT data FROM documents WHERE collection_name = ?", (self.name,)
        )
        rows = cursor.fetchall()
        conn.close()

        for (data_str,) in rows:
            doc = json.loads(data_str)
            if self._match_query(doc, query):
                return self._clean_doc(doc)
        return None

    def find(self, query: Dict[str, Any] = None) -> Any:
        if query is None:
            query = {}
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT data FROM documents WHERE collection_name = ?", (self.name,)
        )
        rows = cursor.fetchall()
        conn.close()

        results = []
        for (data_str,) in rows:
            doc = json.loads(data_str)
            if self._match_query(doc, query):
                results.append(self._clean_doc(doc))
        
        class Cursor:
            def __init__(self, items):
                self.items = items
            def __aiter__(self):
                return self
            async def __anext__(self):
                if not self.items:
                    raise StopAsyncIteration
                return self.items.pop(0)
            async def to_list(self, length: int) -> List[Dict[str, Any]]:
                return self.items[:length]
        return Cursor(results)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> Any:
        doc = await self.find_one(query)
        if not doc:
            class UpdateResult:
                modified_count = 0
                matched_count = 0
            return UpdateResult()

        if "$set" in update:
            for k, v in update["$set"].items():
                doc[k] = v
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO documents VALUES (?, ?, ?)",
            (self.name, doc["_id"], json.dumps(doc)),
        )
        conn.commit()
        conn.close()

        class UpdateResult:
            modified_count = 1
            matched_count = 1
        return UpdateResult()

    async def delete_one(self, query: Dict[str, Any]) -> Any:
        doc = await self.find_one(query)
        if not doc:
            class DeleteResult:
                deleted_count = 0
            return DeleteResult()

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM documents WHERE collection_name = ? AND id = ?",
            (self.name, doc["_id"]),
        )
        conn.commit()
        conn.close()

        class DeleteResult:
            deleted_count = 1
        return DeleteResult()

    async def count_documents(self, query: Dict[str, Any]) -> int:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT data FROM documents WHERE collection_name = ?", (self.name,)
        )
        rows = cursor.fetchall()
        conn.close()

        count = 0
        for (data_str,) in rows:
            doc = json.loads(data_str)
            if self._match_query(doc, query):
                count += 1
        return count

    def _match_query(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "_id" or k == "id":
                if doc.get("_id") != str(v) and doc.get("id") != str(v):
                    return False
            elif isinstance(v, dict):
                # Simple implementation of $or, $regex
                if "$regex" in v:
                    pattern = v["$regex"]
                    options = v.get("$options", "")
                    import re
                    flags = re.IGNORECASE if "i" in options else 0
                    if not re.search(pattern, str(doc.get(k, "")), flags):
                        return False
                elif "$in" in v:
                    if doc.get(k) not in v["$in"]:
                        return False
            else:
                if doc.get(k) != v:
                    return False
        return True


class SQLiteDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def __getitem__(self, name: str) -> SQLiteCollection:
        return SQLiteCollection(self.db_path, name)


class MongoCollectionWrapper:
    def __init__(self, collection):
        self.collection = collection

    def _convert_query(self, query: Dict[str, Any]) -> Dict[str, Any]:
        if not query:
            return query
        new_query = dict(query)
        for k, v in new_query.items():
            if k == "_id" and isinstance(v, str):
                try:
                    new_query[k] = ObjectId(v)
                except Exception:
                    pass
            elif k == "$or" and isinstance(v, list):
                new_query[k] = [self._convert_query(item) for item in v]
        return new_query

    async def insert_one(self, document: Dict[str, Any]) -> Any:
        doc = dict(document)
        if "_id" in doc and isinstance(doc["_id"], str):
            try:
                doc["_id"] = ObjectId(doc["_id"])
            except Exception:
                pass
        return await self.collection.insert_one(doc)

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        q = self._convert_query(query)
        return await self.collection.find_one(q)

    def find(self, query: Dict[str, Any] = None) -> Any:
        q = self._convert_query(query) if query is not None else None
        return self.collection.find(q)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> Any:
        q = self._convert_query(query)
        return await self.collection.update_one(q, update)

    async def delete_one(self, query: Dict[str, Any]) -> Any:
        q = self._convert_query(query)
        return await self.collection.delete_one(q)

    async def count_documents(self, query: Dict[str, Any]) -> int:
        q = self._convert_query(query)
        return await self.collection.count_documents(q)


class MongoDatabaseWrapper:
    def __init__(self, db):
        self.db = db

    def __getitem__(self, name: str) -> MongoCollectionWrapper:
        return MongoCollectionWrapper(self.db[name])


_client = None
_db = None
is_mongodb = False
use_sqlite = False

def get_db():
    global _client, _db, is_mongodb, use_sqlite
    
    if use_sqlite:
        sqlite_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "choice_tailors.db",
        )
        return SQLiteDatabase(sqlite_path)

    if _db is None:
        from dotenv import load_dotenv
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        load_dotenv(os.path.join(base_dir, ".env"))
        
        env_uri = os.environ.get("MONGODB_URI")
        if not env_uri:
            logger.info("MONGODB_URI env variable not found. Defaulting to local SQLite database.")
            use_sqlite = True
            sqlite_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "choice_tailors.db",
            )
            _db = SQLiteDatabase(sqlite_path)
            is_mongodb = False
        else:
            try:
                _client = AsyncIOMotorClient(env_uri, serverSelectionTimeoutMS=2000)
                _db = MongoDatabaseWrapper(_client[settings.DB_NAME])
                is_mongodb = True
            except Exception as e:
                logger.warning(f"Could not connect to MongoDB ({e}). Falling back to SQLite.")
                use_sqlite = True
                sqlite_path = os.path.join(
                    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    "choice_tailors.db",
                )
                _db = SQLiteDatabase(sqlite_path)
                is_mongodb = False
    return _db

class DBProxy:
    def __getitem__(self, name: str):
        return get_db()[name]

db = DBProxy()
