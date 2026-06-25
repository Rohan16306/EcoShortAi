/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("bx2vzj1lkww7ncv")

  collection.listRule = "requester_id = @request.auth.id || receiver_id = @request.auth.id || status = 'PENDING' || @request.auth.role = 'ROLE_ADMIN'"
  collection.viewRule = "requester_id = @request.auth.id || receiver_id = @request.auth.id || status = 'PENDING' || @request.auth.role = 'ROLE_ADMIN'"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("bx2vzj1lkww7ncv")

  collection.listRule = "@request.auth.id != ''"
  collection.viewRule = "@request.auth.id != ''"

  return dao.saveCollection(collection)
})
