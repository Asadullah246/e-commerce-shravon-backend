const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const multer = require("multer");
const SSLCommerzPayment = require("sslcommerz-lts");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
// const http = require('http');
// const socketIo = require('socket.io');

app.use(cors());
app.use(express.json());

// ... other imports

// const server = require('http').createServer();
// const io = require('socket.io')(server);
// io.on('', client => {
//   client.on('event', data => {
//     console.log("data",data );
//     // io.emit('newMessage', message);
//   });
//   client.on('disconnect', () => {
//     console.log("disconnected");
//   });
// });
// server.listen(3000);

// const server = http.createServer(app);
// const io = socketIo(server);

// io.on('connection', (socket) => {
//   console.log('A user connected');

//   // Listen for messages from the client
//   socket.on('newMessage', (message) => {
//     // Save the message to MongoDB
//     // ...

//     // Broadcast the new message to all connected clients
//     io.emit('newMessage', message);
//   });

//   // Handle disconnection
//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });
// });

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

const paymentUrl = "http://localhost:5000";

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;

const is_live = false;

async function run() {
  try {
    const ProductCollection = client.db("Dal").collection("Product");
    const CartCollection = client.db("Dal").collection("CartProduct");
    const OrderCollection = client.db("Dal").collection("OrderProduct");
    const adminCollection = client.db("Dal").collection("Admin");
    const feedbackCollection = client.db("Dal").collection("Feedback");
    const messageCollection = client.db("Dal").collection("Messages");

    // messages

    app.put("/messages/:id", async (req, res) => {
      const body = req.body;
      const id = req.params.id;
      const query = { user: id };
      const exist =await  messageCollection.findOne(query);
      console.log("exist", exist);
      if (exist) {
        const options = { upsert: true };
        const updatedData = {
          $set: body,
        };
        const newM = {
          user: body?.user,
          text: body?.text,
        };

        const result = await messageCollection.updateOne(
          query,
          { $push: { messages: newM } },
          // updatedData,
          options
        );
        res.send(result);
      }

      else {
        const newData = {
          user: body?.user,
          messages: [{ user: body?.user, text: body?.text }],
        };
        const result = await messageCollection.insertOne(newData);
        res.send(result);
      }
    });

    app.get("/messages/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { user: id };
      const msg = await messageCollection.findOne(quary);
      res.send(msg);
    });
    app.get("/messages", async (req, res) => {
      //get the value from server
      const quary = {};
      const cursor = messageCollection.find(quary);
      const Products = await cursor.toArray();
      res.send(Products);
    });

    app.delete("/messages/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) }; 
      const Product = await messageCollection.deleteOne(quary);
      res.send(Product);
    });

    // messages
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
        const { productName, price, Detail } = req.body;

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

    // feedback --------------------------------------------------------

    app.post("/feedback", async (req, res) => {
      const product = req.body;
      const result = await feedbackCollection.insertOne(product);
      res.send(result);
    });

    app.get("/feedback", async (req, res) => {
      const quary = {};
      const cursor = feedbackCollection.find(quary);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/feedback/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const Product = await feedbackCollection.deleteOne(quary);
      res.send(Product);
    });

    // orders ----------------------------------------------------------

    app.post("/OrderProduct", async (req, res) => {
      const body = req.body;
      delete body._id;
      const unId = new ObjectId().toString();
      const data = {
        total_amount: Number(body.totalprice),
        currency: "BDT",
        tran_id: unId, // use unique tran_id for each api call
        success_url: `${paymentUrl}/payment/success/${unId}`,
        fail_url: `${paymentUrl}/payment/fail/${unId}`,
        cancel_url: `${paymentUrl}/payment/cancel/${unId}`,
        // fail_url: 'http://localhost:3030/fail',
        // cancel_url: 'http://localhost:3030/cancel',
        ipn_url: `${paymentUrl}/ipn`,
        // ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: "Customer Name",
        cus_email: "customer@example.com",
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };

      const neworder = await OrderCollection.insertOne({
        ...body,
        delivered: "pending",
      });

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        console.log("Redirecting to: ", GatewayPageURL);
        res.send({ url: GatewayPageURL });
      });
    });

    app.post("/payment/success/:unId", async (req, res) => {
      const id = req.params.unId;
      console.log("id", id);

      // res.send(newBlog);
      res.redirect(`http://localhost:3000/success`);
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
