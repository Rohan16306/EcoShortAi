/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "a45pkneyi0io7pn",
    "created": "2026-06-22 16:55:01.708Z",
    "updated": "2026-06-22 16:55:01.708Z",
    "name": "global_stats",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "bfcnjxo4",
        "name": "total_co2_saved",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.role = 'admin'",
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("a45pkneyi0io7pn");

  return dao.deleteCollection(collection);
})
