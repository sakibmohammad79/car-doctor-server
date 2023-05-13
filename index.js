const express = require("express")
const cors = require("cors");
require('dotenv').config()
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// set meddlewar
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5a8lj4m.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyjwt = (req, res, next) =>{
  console.log(req.headers.authorization);
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.send({error: true, message: 'unauthorization access'})
  }
  const token = authorization.split(' ')[1];
  console.log('token inside verify jwt', token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) =>{
    if(error){
      return res.status(403).send({error: true,  message: 'unauthorize access'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const carServiceCollection = client.db('carDoctor').collection('services');
    const bookingCollection = client.db('carDoctor').collection('bookings')

    //jwt
    app.post('/jwt', (req, res) => {
      const user = req.body;
      console.log(user);
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      })
      res.send({token})
    })

    //services
    app.get('/services', async (req, res ) => {
        const curson = carServiceCollection.find();
        const result = await curson.toArray();
        res.send(result);
    })
    
    app.get('/services/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const options = {
            // Include only the `title` and `imdb` fields in the returned document
            projection: { title: 1, price: 1, service_id: 1, img: 1,   },
          };
        const result = await carServiceCollection.findOne(query, options);
        res.send(result);
    })

    //bookings
    app.get('/booking', verifyjwt, async(req, res) => {
     console.log(req.headers.authorization);
      const decoded = req.decoded;
      if(decoded.email !== req.query.email){
        return res.status(403).send({error: 1, message: 'forbidden access'})
      }

      let query = {}
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/booking', async(req, res) => {
        const booking = req.body;
        const result = await bookingCollection.insertOne(booking);
        res.send(result);

    })

    app.patch('/booking/:id', async(req, res) => {
      const id = req.params.id;
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          status: updatedBooking.status
        },
      }
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.delete('/booking/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('cars doctor are set');
})

app.listen(port, () => {
    console.log(`car doctors are running on ${port}`);
})