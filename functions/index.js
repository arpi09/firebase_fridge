const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors({ origin: true }));

var serviceAccount = require("./auth.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fridge-23daa..firebaseio.com",
});
const db = admin.firestore();

app.get("/api/user/fridge/:fridgeId", (req, res) => {
  (async () => {
    if (!req.headers.authorization) {
      return res.status(403).json({ error: "No credentials sent!" });
    }
    try {
      admin
        .auth()
        .verifyIdToken(req.headers.authorization)
        .then(async (decodedToken) => {
          const uid = decodedToken.uid;

          const response = await getFridgeData(req.params.fridgeId, uid);

          return res.status(200).send(response);
        })
        .catch((error) => {
          return res.status(401).json({ error: error });
        });
    } catch (error) {
      return res.status(500).send(error);
    }
  })();
});

app.post("/api/user/fridge/:fridgeId/grocery", (req, res) => {
  (async () => {
    if (!req.headers.authorization) {
      return res.status(403).json({ error: "No credentials sent!" });
    }
    try {
      admin
        .auth()
        .verifyIdToken(req.headers.authorization)
        .then(async (decodedToken) => {
          const uid = decodedToken.uid;

          try {
            //Add grocery
            await db
              .collection("users")
              .doc(uid)
              .collection("fridges")
              .doc(req.params.fridgeId)
              .collection("groceries")
              .add({
                name: req.body.name,
                bestBefore: admin.firestore.Timestamp.fromDate(
                  new Date("2020-01-01T00:00:00.000Z")
                ),
              });

            const response = await getFridgeData(req.params.fridgeId, uid);

            return res.status(200).send(response);
          } catch (error) {
            return res.status(500).send(error);
          }
        })
        .catch((error) => {
          return res.status(401).json({ error: error });
        });
    } catch (error) {
      return res.status(500).send(error);
    }
  })();
});

app.delete("/api/user/fridge/:fridgeId/grocery", (req, res) => {
  (async () => {
    if (!req.headers.authorization) {
      return res.status(403).json({ error: "No credentials sent!" });
    }
    try {
      admin
        .auth()
        .verifyIdToken(req.headers.authorization)
        .then(async (decodedToken) => {
          const uid = decodedToken.uid;

          try {
            //Delete groceries
            req.body.groceries.forEach(async function (item, index) {
              await db
                .collection("users")
                .doc(uid)
                .collection("fridges")
                .doc(req.params.fridgeId)
                .collection("groceries")
                .doc(item)
                .delete();
            });

            const response = await getFridgeData(req.params.fridgeId, uid);

            return res.status(200).send(response);
          } catch (error) {
            return res.status(500).send(error);
          }
        })
        .catch((error) => {
          return res.status(401).json({ error: error });
        });
    } catch (error) {
      return res.status(500).send(error);
    }
  })();
});

app.get("/api/user/fridges", (req, res) => {
  (async () => {
    if (!req.headers.authorization) {
      return res.status(403).json({ error: "No credentials sent!" });
    }
    try {
      admin
        .auth()
        .verifyIdToken(req.headers.authorization)
        .then(async (decodedToken) => {
          const uid = decodedToken.uid;
          let query = await db
            .collection("users")
            .doc(uid)
            .collection("fridges");
            
          let response = [];

          await query.get().then((querySnapshot) => {
            let docs = querySnapshot.docs;
            for (let doc of docs) {
              const selectedItem = {
                id: doc.id,
                name: doc.data().name,
              };
              response.push(selectedItem);
            }
            return;
          });
          return res.status(200).send(response);
        })
        .catch((error) => {
          return res.status(401).json({ error: error });
        });
    } catch (error) {
      return res.status(500).send(error);
    }
  })();
});

app.put("/api/user/fridge/:fridgeId/grocery", (req, res) => {
  (async () => {
    if (!req.headers.authorization) {
      return res.status(403).json({ error: "No credentials sent!" });
    }
    try {
      admin
        .auth()
        .verifyIdToken(req.headers.authorization)
        .then(async (decodedToken) => {
          const uid = decodedToken.uid;
          try {
            //Update grocery
            await db
              .collection("users")
              .doc(uid)
              .collection("fridges")
              .doc(req.params.fridgeId)
              .collection("groceries")
              .doc(req.body.grocery.id)
              .update(req.body.grocery);

            const response = await getFridgeData(req.params.fridgeId, uid);

            return res.status(200).send(response);
          } catch (error) {
            return res.status(500).send(error);
          }
        })
        .catch((error) => {
          return res.status(401).json({ error: error });
        });
    } catch (error) {
      return res.status(500).send(error);
    }
  })();
});

const getFridgeData = async (fridgeId, uid) => {
  let response = {};

  //Get fridge data
  let queryFridge = db
    .collection("users")
    .doc(uid)
    .collection("fridges")
    .doc(fridgeId);
  await queryFridge.get().then((querySnapshot) => {
    response = querySnapshot.data();
    return;
  });

  //Get groceries for fridge
  let groceries = [];

  let queryGroceries = db
    .collection("users")
    .doc(uid)
    .collection("fridges")
    .doc(fridgeId)
    .collection("groceries");
  await queryGroceries.get().then((querySnapshot) => {
    let docs = querySnapshot.docs;
    for (let doc of docs) {
      const selectedItem = {
        id: doc.id,
        name: doc.data().name,
        bestBefore: doc.data().bestBefore.toDate(),
        amount: doc.data().amount,
      };
      groceries.push(selectedItem);
    }
    return;
  });
  response.groceries = groceries;

  return response;
};

exports.app = functions.https.onRequest(app);
