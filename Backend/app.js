//pass = 094FWjs6CLyh2fO7

require("dotenv").config();

const express = require('express');
const mongoose = require('mongoose');
const routes = require("./Routes/supplierRoutes");
const supplementRoutes = require("./Routes/supplementRoutes");


const app = express();
const cors = require('cors');

// Middleware 
app.use(express.json());
app.use(cors());
app.use("/suppliers", routes);
app.use("/supplements", supplementRoutes);

// Use a non-SRV (mongodb://) connection string if SRV DNS lookups are blocked.
const uri = "mongodb://admin:094FWjs6CLyh2fO7@ac-xfyiebp-shard-00-00.69u6mvp.mongodb.net:27017,ac-xfyiebp-shard-00-01.69u6mvp.mongodb.net:27017,ac-xfyiebp-shard-00-02.69u6mvp.mongodb.net:27017/suppliers?replicaSet=atlas-7i9kvq-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(uri)
    .then(() => console.log("Connected to MongoDB"))
    .then(() => {
        app.listen(5000, () => console.log("Server running on port 5000"));
    })
    .catch((err) => console.log(err));