const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const multer = require("multer");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://dall:Of6FvN07CeEwsrKg@cluster0.nv6lbgx.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    // Generate a unique name for the file
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // Get the file extension
    const ext = path.extname(file.originalname);

    // Create the final filename with the extension
    const filename = uniqueName + ext;
    const relativePath = "uploads/" + filename;

    console.log("relativ", relativePath);

    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

async function run() {
  try {
    const ProductCollection = client.db("Dal").collection("Product");
    const CartCollection = client.db("Dal").collection("CartProduct");
    const OrderCollection = client.db("Dal").collection("OrderProduct");
    const adminCollection = client.db("Dal").collection("Admin");

    // admin ---------------------------------------------------
    app.get("/Admin", async (req, res) => {
      //get the value from server
      const quary = {};
      const cursor = adminCollection.find(quary);
      const Products = await cursor.toArray();
      res.send(Products);
    });

    app.get("/Admin/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const Product = await adminCollection.findOne(quary);
      res.send(Product);
    });

    app.post("/Admin", async (req, res) => {
      const product = req.body;
      const result = await adminCollection.insertOne(product);
      res.send(result);
    });

    // product ------------------------------------------------

    app.get("/Products", async (req, res) => {
      //get the value from server
      const quary = {};
      const cursor = ProductCollection.find(quary);
      const Products = await cursor.toArray();
      res.send(Products);
    });

    app.get("/Products/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const Product = await ProductCollection.findOne(quary);
      res.send(Product);
    });

    app.delete("/Products/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const Product = await ProductCollection.deleteOne(quary);
      res.send(Product);
    });

    app.post(
        "/Products",
        upload.fields([
          { name: "thumb", maxCount: 1 },
          { name: "files", maxCount: 5 },
        ]),
        async (req, res) => {
          const files = req.files;
          const {
           productName,
           price,
           Detail
          } = req.body;

          if (!files) {
            return res.status(400).json({ message: "Missing required files" });
          }

          const thumb = req.files["thumb"] ? req.files["thumb"][0] : null;
          const multipleFiles = req.files["files"] || [];

          // Process the singleFile and multipleFiles as needed
          const singleFilePath = thumb ? "uploads/" + thumb.filename : null;
          const multipleFilePaths = multipleFiles.map(
            (file) => "uploads/" + file.filename
          );

          const newProduct = {
            productName,
            price,
            Detail,
            image2: multipleFilePaths,
            image: singleFilePath,
          };

          const newBlog = await ProductCollection.insertOne(newProduct);
          res.send(newBlog);
        }
      );











    // cart -----------------------------------------------------

    app.post("/CartProduct", async (req, res) => {
      const product = req.body;
      const result = await CartCollection.insertOne(product);
      res.send(result);
    });

    app.get("/CartProduct", async (req, res) => {
      const quary = {};
      const cursor = CartCollection.find(quary);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/CartProduct/:email", async (req, res) => {
      const email = req.params.email;
      const quary = { email: email };
      const Product = CartCollection.find(quary);
      const result = await Product.toArray();
      res.send(result);
    });

    app.delete("/CartProduct/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const Product = await CartCollection.deleteOne(quary);
      res.send(Product);
    });

    app.post("/OrderProduct", async (req, res) => {
      //post the value on server
      const product = req.body;
      const result = await OrderCollection.insertOne(product);
      res.send(result);
    });

    app.get("/OrderProduct", async (req, res) => {
      const Product = OrderCollection.find({});
      const result = await Product.toArray();
      res.send(result);
    });
    app.put("/OrderProduct/:id", async (req, res) => {
        const body = req.body;
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updatedData = {
          $set: body,
        };

        const result = await OrderCollection.updateOne(
          query,
          updatedData,
          options
        );
        res.send(result);
        // console.log(newBlog);
      });

    app.get("/OrderProduct/:email", async (req, res) => {
      const email = req.params.email;
      const quary = { email: email };
      const Product = OrderCollection.find(quary);
      const result = await Product.toArray();
      res.send(result);
    });

    console.log("successfully connected to MongoDB!");
  } finally {
  }
}
run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Node Server Running");
});

app.listen(port, () => {
  console.log(`Server Running on : ${port}`);
});
