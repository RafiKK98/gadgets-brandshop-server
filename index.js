const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gf4ueyo.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
        serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
    // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const database = client.db('brandShopDB');
        const productsCollection = database.collection("productsCollection");
        const cartCollection = database.collection("cartCollection");

        const estimate = await productsCollection.estimatedDocumentCount();
        console.log(`Estimated count: ${estimate}`);

        // JWT APIs
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' });
            res.send({ token });
        });

        // middleware for verifying jwt access token
        const verifyToken = (req, res, next) => {
            const authorization = req.headers.authorization;
            if(!authorization) {
                return res.status(401).send({ message: 'Unauthorized access' });
            }
            const token = authorization.split(' ').at(1);
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorized access' });
                }
                req.decoded = decoded;
                next();
            });
        }
        // products related APIs
        app.get("/products", async (req, res) => {
            const cursor = productsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get("/products/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await productsCollection.findOne(filter);
            res.send(result);
        });
        app.post("/products", async (req, res) => {
            const newProduct = req.body;
            console.log(newProduct);
            const result = await productsCollection.insertOne(newProduct);
            res.send(result);
        })
        app.put("/products/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedProduct = req.body;

            const product = {
                $set: {
                    name: updatedProduct.name,
                    photo: updatedProduct.photo,
                    brand: updatedProduct.brand,
                    type: updatedProduct.type,
                    price: updatedProduct.price,
                    description: updatedProduct.description,
                    rating: updatedProduct.rating,
                }
            }
            const result = await productsCollection.updateOne(filter, product, options);
            res.send(result);
        })

        // cart related APIs
        app.get('/cart', async (req, res) => {
            const cursor = cartCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        app.post('/cart', async (req, res) => {
            const newCartItem = req.body;
            console.log(newCartItem);
            const result = await cartCollection.insertOne(newCartItem);
            res.send(result);
        })
        app.delete("/cart/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(filter);
            res.send(result);
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send('Hello from server!')
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});