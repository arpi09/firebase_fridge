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

// app.get("/hello-world", (req, res) => {
//   return res.status(200).send("Hello World!");
// });

// app.post("/api/user", (req, res) => {
//   (async () => {
//     if (!req.headers.authorization) {
//       return res.status(403).json({ error: "No credentials sent!" });
//     }
//     try {
//       admin
//         .auth()
//         .verifyIdToken(req.headers.authorization)
//         .then(async (decodedToken) => {
//           const uid = decodedToken.uid;
//           try {
//             await db
//               .collection("users")
//               .doc("/" + uid + "/")
//               .create({ user: "hehehe" });
//             return res.status(200).send();
//           } catch (error) {
//             console.log(error);
//             return res.status(500).send(error);
//           }
//         })
//         .catch((error) => {
//           return res.status(401).json({ error: error });
//         });
//     } catch (error) {
//       console.log(error);
//       return res.status(500).send(error);
//     }
//   })();
// });

// app.get("/api/user/:id", (req, res) => {
//   (async () => {
//     try {
//       const document = db.collection("users").doc(req.params.id);
//       let item = await document.get();
//       let response = item.data();
//       return res.status(200).send(response);
//     } catch (error) {
//       console.log(error);
//       return res.status(500).send(error);
//     }
//   })();
// });

// app.get("/api/users", (req, res) => {
//   (async () => {
//     try {
//       let query = db.collection("users");
//       let response = [];
//       await query.get().then((querySnapshot) => {
//         let docs = querySnapshot.docs;
//         for (let doc of docs) {
//           const selectedItem = {
//             id: doc.id,
//             user: doc.data().user,
//           };
//           response.push(selectedItem);
//         }
//         return;
//       });
//       return res.status(200).send(response);
//     } catch (error) {
//       console.log(error);
//       return res.status(500).send(error);
//     }
//   })();
// });

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

          let response = {};

          //Get fridge data
          let queryFridge = db
            .collection("users")
            .doc(uid)
            .collection("fridges")
            .doc(req.params.fridgeId);
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
            .doc(req.params.fridgeId)
            .collection("groceries");
          await queryGroceries.get().then((querySnapshot) => {
            let docs = querySnapshot.docs;
            for (let doc of docs) {
              const selectedItem = {
                id: doc.id,
                name: doc.data().name,
                bestBefore: doc.data().bestBefore.toDate(),
              };
              groceries.push(selectedItem);
            }
            return;
          });
          response.groceries = groceries;

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
          const date = new Date("2015-08-25T15:35:58.000Z");
          try {
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

            let response = {};

            //Get fridge data
            let queryFridge = db
              .collection("users")
              .doc(uid)
              .collection("fridges")
              .doc(req.params.fridgeId);
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
              .doc(req.params.fridgeId)
              .collection("groceries");
            await queryGroceries.get().then((querySnapshot) => {
              let docs = querySnapshot.docs;
              for (let doc of docs) {
                const selectedItem = {
                  id: doc.id,
                  name: doc.data().name,
                  bestBefore: doc.data().bestBefore.toDate(),
                };
                groceries.push(selectedItem);
              }
              return;
            });
            response.groceries = groceries;

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

// app.delete("/api/user/:id", (req, res) => {
//   (async () => {
//     try {
//       const document = db.collection("users").doc(req.params.id);
//       await document.delete();
//       return res.status(200).send();
//     } catch (error) {
//       console.log(error);
//       return res.status(500).send(error);
//     }
//   })();
// });

exports.app = functions.https.onRequest(app);
