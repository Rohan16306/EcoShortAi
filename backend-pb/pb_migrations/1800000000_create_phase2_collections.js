/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  // 1. Create pickup_requests
  const pickupRequests = new Collection({
    "id": "pickup_req_12345",
    "name": "pickup_requests",
    "type": "base",
    "system": false,
    "schema": [
      { "name": "user", "type": "relation", "required": false, "options": { "collectionId": "_pb_users_auth_", "cascadeDelete": false, "maxSelect": 1 } },
      { "name": "userName", "type": "text", "required": true, "options": { "max": 255 } },
      { "name": "phone", "type": "text", "required": true, "options": { "max": 20 } },
      { "name": "address", "type": "text", "required": true, "options": { "max": 500 } },
      { "name": "area", "type": "text", "required": true, "options": { "max": 100 } },
      { "name": "wasteType", "type": "text", "required": true, "options": { "max": 100 } },
      { "name": "estimatedKg", "type": "number", "required": true, "options": { "noDecimal": false } },
      { "name": "preferredTime", "type": "text", "required": false, "options": { "max": 100 } },
      { "name": "distance", "type": "text", "required": false, "options": { "max": 50 } },
      { "name": "lat", "type": "number", "required": true, "options": { "noDecimal": false } },
      { "name": "lng", "type": "number", "required": true, "options": { "noDecimal": false } },
      { "name": "status", "type": "select", "required": true, "options": { "values": ["pending", "accepted", "on-the-way", "arrived", "collected", "completed", "rejected"], "maxSelect": 1 } },
      { "name": "notes", "type": "text", "required": false, "options": { "max": 500 } },
      { "name": "collectorId", "type": "relation", "required": false, "options": { "collectionId": "_pb_users_auth_", "cascadeDelete": false, "maxSelect": 1 } },
      { "name": "collectorName", "type": "text", "required": false, "options": { "max": 255 } },
      { "name": "collectorPhone", "type": "text", "required": false, "options": { "max": 20 } },
      { "name": "collectorRating", "type": "number", "required": false, "options": { "noDecimal": false } },
      { "name": "collectorVehicle", "type": "text", "required": false, "options": { "max": 100 } },
      { "name": "userRating", "type": "number", "required": false, "options": { "noDecimal": false } },
      { "name": "creditsAwarded", "type": "number", "required": false, "options": { "noDecimal": false } },
      { "name": "collectorCreditsAwarded", "type": "number", "required": false, "options": { "noDecimal": false } }
    ],
    "indexes": [
      "CREATE INDEX idx_pickup_requests_status ON pickup_requests (status)",
      "CREATE INDEX idx_pickup_requests_user ON pickup_requests (user)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": ""
  });
  dao.saveCollection(pickupRequests);

  // 2. Create rewards
  const rewards = new Collection({
    "id": "rewards_cat_1234",
    "name": "rewards",
    "type": "base",
    "system": false,
    "schema": [
      { "name": "name", "type": "text", "required": true, "options": { "max": 255 } },
      { "name": "description", "type": "text", "required": false, "options": { "max": 500 } },
      { "name": "creditsCost", "type": "number", "required": true, "options": { "noDecimal": false } },
      { "name": "icon", "type": "text", "required": false, "options": { "max": 100 } },
      { "name": "category", "type": "select", "required": true, "options": { "values": ["voucher", "service", "impact"], "maxSelect": 1 } }
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null
  });
  dao.saveCollection(rewards);

  // 3. Create claimed_rewards
  const claimedRewards = new Collection({
    "id": "claimed_rew_123",
    "name": "claimed_rewards",
    "type": "base",
    "system": false,
    "schema": [
      { "name": "user", "type": "relation", "required": true, "options": { "collectionId": "_pb_users_auth_", "cascadeDelete": false, "maxSelect": 1 } },
      { "name": "reward", "type": "relation", "required": true, "options": { "collectionId": "rewards_cat_1234", "cascadeDelete": false, "maxSelect": 1 } },
      { "name": "rewardName", "type": "text", "required": true, "options": { "max": 255 } },
      { "name": "creditsCost", "type": "number", "required": true, "options": { "noDecimal": false } }
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": null,
    "deleteRule": null
  });
  dao.saveCollection(claimedRewards);

}, (db) => {
  const dao = new Dao(db);
  
  try {
    const pickupReq = dao.findCollectionByNameOrId("pickup_requests");
    dao.deleteCollection(pickupReq);
  } catch (e) {}

  try {
    const rew = dao.findCollectionByNameOrId("rewards");
    dao.deleteCollection(rew);
  } catch (e) {}

  try {
    const claimed = dao.findCollectionByNameOrId("claimed_rewards");
    dao.deleteCollection(claimed);
  } catch (e) {}
});
