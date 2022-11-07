const express = require('express') ;
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// jwt
const jwt = require('jsonwebtoken');

const app = express();
require('dotenv').config() ;

const port = process.env.PORT || 5000 ;

// mdddle wares
app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p2qoups.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// jwt function
function verifyJWT (req,res,next) {
  // console.log(req.headers.authorization)
  const authHeader = req.headers.authorization;
  if(!authHeader) {
    return res.status(401).send({message : 'unauthorize access'})
  } 
  const token = authHeader.split(' ')[1] ;
  jwt.verify(token,process.env.ACCESS_TOKEN,function(err,decoded){
    if(err)  {
      return res.status(401).send({message : 'unauthorize access'})
    }
    req.decoded = decoded;
    next()
  })

}

async function run () {
  try {
    const volunteerCollection = client.db("volunteer").collection("users");

    // jwt 
    app.post('/jwt' , (req,res) => {
      const user = req.body ;
      // console.log(user);
      const token = jwt.sign(user,process.env.ACCESS_TOKEN,{
        expiresIn : '1h'
      })
      res.send({token})
    })
  
  // create
  app.post('/users' , async(req,res) => {
    const user = req.body ;
    const result = await volunteerCollection.insertOne(user);
    res.send(result)
  })

  // read all
  // pagination
  // jwt 
  app.get('/users',verifyJWT, async(req,res)=> {
    const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);
    
    // console.log(page,size);
    // console.log(req.headers.authorization)
    // const decoded = req.decoded ;
    // console.log('inside user api',decoded);
    // if(decoded.email !== req.query.email) {
    //   return res.status(403).send({message : 'Forbidded access'})
    // }

    const query = {} ;
    const cursor = volunteerCollection.find(query);
    const datas = await cursor.skip(page*size).limit(size).toArray();
    const count = await volunteerCollection.estimatedDocumentCount();
    // console.log(count);
    res.send({count,datas})
  })


  // read one
  app.get('/user/:id', async(req,res)=> {
    const id = req.params.id;
    const query = {_id : ObjectId(id)};
    const user = await volunteerCollection.findOne(query);
    res.send(user)
  })

  // update one
  app.put('/user/:id' , async(req,res)=> {
    const id = req.params.id ;
    const user = req.body;  
    const query = {_id : ObjectId(id)};
    const updateDoc = {
      $set : {
          name : user.name ,
          email : user.email,
          date : user.date,
          desicription : user.desicription,
          books : user.books,
      }
    }
    const result = await volunteerCollection.updateOne(query,updateDoc);
    res.send(result)
  })

  // delete one
  app.delete('/user/:id' , async(req,res)=> {
    const id = req.params.id ;
    const query = {_id : ObjectId(id)};
    const result = await volunteerCollection.deleteOne(query);
    res.send(result)
  })

  }
  finally{

  }

}

run().catch(err => console.log(err))

app.get('/' , (req,res)=> {
  res.send('server is running')
})

app.listen(port , () => {
  console.log(`server is runnig on port ${port}`);
})
