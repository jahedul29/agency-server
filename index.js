const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
require("dotenv").config();

// Mongodb
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n6je5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());

const port = 5000 || process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// connecting to database
client.connect((err) => {
  // ---------------------------------Services database collection
  const serviceCollection = client
    .db(process.env.DB_NAME)
    .collection("services");
  // perform actions on the collection object
  console.log("database connection established");

  // api to get all service
  app.get("/getServices", (req, res) => {
    serviceCollection.find({}).toArray((err, services) => {
      res.status(200).send(services);
    });
  });

  //api to add service to database
  app.post("/addService", (req, res) => {
    const data = req.body;
    const file = req.files.file;
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };
    const service = { ...data, image };
    serviceCollection.insertOne(service).then((result) => {
      if (result.insertedCount > 0) {
        res.status(200).send(result.insertedCount > 0);
      } else {
        res.statusCode(400);
      }
    });
  });

  //------------------------------ Works database collection
  const worksCollection = client.db(process.env.DB_NAME).collection("works");

  // api to get all works
  app.get("/getWorks", (req, res) => {
    worksCollection
      .find({})
      .project({ _id: 1, image: 1 })
      .toArray((err, works) => {
        res.status(200).send(works);
      });
  });

  //---------------------- Feedback database collection
  const feedbackCollection = client
    .db(process.env.DB_NAME)
    .collection("feedbacks");

  //  api to get all feedbacks
  app.get("/getFeedbacks", (req, res) => {
    feedbackCollection.find({}).toArray((err, feedbacks) => {
      res.status(200).send(feedbacks);
    });
  });

  //api to add feedback to database
  app.post("/addFeedback", (req, res) => {
    const feedback = req.body;
    feedbackCollection.insertOne(feedback).then((result) => {
      if (result.insertedCount > 0) {
        res.status(200).send(result.insertedCount > 0);
      } else {
        res.statusCode(400);
      }
    });
  });

  //------------------------- Orders database collection
  const orderCollection = client.db(process.env.DB_NAME).collection("orders");

  // api to add order
  app.post("/addOrder", (req, res) => {
    const data = req.body;
    const file = req.files.file;
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };
    const order = { ...data, image };

    orderCollection.insertOne(order).then((result) => {
      if (result.insertedCount > 0) {
        res.status(200).send(result.insertedCount > 0);
      } else {
        res.sendStatus(400);
      }
    });
  });

  // api to get all order
  app.get("/getOrders", (req, res) => {
    const queryEmail = req.query.email;
    let filterObject = { email: queryEmail };
    const projectObject = {};
    if (!queryEmail) {
      filterObject = {};
      projectObject.image = 0;
    }

    orderCollection
      .find(filterObject)
      .project(projectObject)
      .toArray((err, orders) => {
        if (orders.length > 0) {
          res.status(200).send(orders);
        } else {
          res.sendStatus(400);
        }
      });
  });

  // api to update order
  app.patch("/updateOrderStatus", (req, res) => {
    const orderId = req.body.id;
    const status = req.body.status;
    orderCollection
      .updateOne({ _id: ObjectId(orderId) }, { $set: { status: status } })
      .then((result) => {
        if (result.modifiedCount) {
          res.status(200).send(result.modifiedCount > 0);
        } else {
          res.sendStatus(400);
        }
      });
  });

  // api to delete order
  app.delete("/cancelOrder/:id", (req, res) => {
    const id = req.params.id;
    orderCollection.deleteOne({ _id: ObjectId(id) }).then((result) => {
      if (result.deletedCount > 0) {
        res.status(200).send(result.deletedCount > 0);
      } else {
        res.sendStatus(400);
      }
    });
  });

  // api to search text from add records
  app.get("/searchInOrder", (req, res) => {
    const searchText = req.query.searchTxt;
    orderCollection
      .find({ email: { $regex: searchText } })
      .project({ image: 0 })
      .toArray((err, result) => {
        if (result) {
          res.status(200).send(result);
        } else {
          res.sendStatus(404);
        }
      });
  });

  //------------------------- Admin database collection
  const adminCollection = client.db(process.env.DB_NAME).collection("admins");

  app.post("/addAdmin", (req, res) => {
    adminCollection.insertOne(req.body).then((result) => {
      if (result.insertedCount > 0) {
        res.status(200).send(result.insertedCount > 0);
      } else {
        res.sendStatus(400);
      }
    });
  });

  app.get("/getAdmins", (req, res) => {
    adminCollection.find({}).toArray((err, admins) => {
      if (admins.length > 0) {
        res.status(200).send(admins);
      } else {
        res.sendStatus(400);
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
