const express= require('express');
const app= express();
const cors=require('cors');
const mongoose= require('mongoose');
const User = require('./models/user.model')
const jwt = require('jsonwebtoken')
const bcrypt= require('bcryptjs');
var path = require ("path")
require("dotenv").config()
app.use(cors());
app.use(express.json());

// app.use(express.static(path.join(__dirname, "/new")));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '/new/build', 'index.html'));
// });


mongoose.connect( process.env.MONGO_URI || "mongodb://localhost:27017/selfmade-users",{
  useNewUrlParser:true,
  useUnifiedTopology:true
}) .then(console.log("Connected to mongoDB")).catch((err)=>console.log(err));

app.post('/api/register',async(req,res)=>{
    console.log(req.body)
    try {
      const newPassword= await bcrypt.hash(req.body.password,10)
      const user= await User.create({
        name:req.body.name,
          email:req.body.email,
          password:newPassword,
      })  
      const token=jwt.sign({
        name:user.name,
        email:user.email
      },'secret123')
      res.json({status:'ok', user: token})
    } catch (error) {
        console.log(error)
      res.json({status:'error', error:'Duplicate email'})
        
    }
    
})
app.post('/api/login',async(req,res)=>{
    try {
     const user= await User.findOne({
         email:req.body.email,
        })

        if(!user){return {status:'error', error :'Invalid login'}}
        const isPasswordValid=await bcrypt.compare(req.body.password,user.password)
    if (isPasswordValid){
      const token=jwt.sign({
        name:user.name,
        email:user.email
      },'secret123')
        return res.json({status:'ok', user: token})
    }else{
        return res.json({status:'error', user: false})

    }
    } catch (error) {
        console.log(error)

      res.json({status:'error', error:'Internal Server Error'})
        
    }
    
})

app.get('/api/quote', async (req, res) => {
	const token = req.headers['x-access-token']

	try {
		const decoded = jwt.verify(token, 'secret123')
		const email = decoded.email
		const user = await User.findOne({ email: email })

		return res.json({ status: 'ok', quote: user.quote })
	} catch (error) {
		console.log(error)
		res.json({ status: 'error', error: 'invalid token' })
	}
})

app.post('/api/quote', async (req, res) => {
	const token = req.headers['x-access-token']

	try {
		const decoded = jwt.verify(token, 'secret123')
		const email = decoded.email
		await User.updateOne(
			{ email: email },
			{ $set: { quote: req.body.quote } }
		)

		return res.json({ status: 'ok', quote:User.quote})
	} catch (error) {
		console.log(error)
		res.json({ status: 'error', error: 'invalid token' })
	}
})

// Check if its on heroku

  // Step 1:
app.use(express.static(path.resolve(__dirname, "./frontend/build")));
// Step 2:
app.get("*", function (request, response) {
  response.sendFile(path.resolve(__dirname, "./frontend/build", "index.html"));
});

app.listen(process.env.PORT || 5000 ,()=>[
    console.log(`server started on ${process.env.PORT || 5000}`)
]) 