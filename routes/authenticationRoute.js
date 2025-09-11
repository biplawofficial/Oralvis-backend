const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../userModels/user");
router.post("/register", async (req,res)=>{
    try{
        const {name,email,password,role} = req.body
        if(!name || !email || !password || !role){
            return res.status(400).json({message:"All fields are required"})
        }
        const exist=await User.findOne({email})
        if(exist){
            return res.status(400).json({message:"User already exists with this email id!"})
        }
        const user=new User({name,email,password,role})
        await user.save()
        const token=jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET,{expiresIn:"7d"})
        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
              id: user._id, 
              name: user.name,
              email: user.email,
              role: user.role,
            },
          });
    }
    catch(error){
        return res.status(500).json({message:"error"})
    }
})

router.post("/login", async (req,res)=>{
    try{
        const{email,password}=req.body
    if(!email || !password) return res.status(400).json({message:"All fields are required"})
    const user=await User.findOne({email})
    if(!user) return res.status(400).json({message:`User Does Not Exist!`})
    const check=await user.comparePassword(password)
    if(!check) return res.status(400).json({message:"Invalid Credentials"})
    const token=jwt.sign({
            id:user._id,
            role:user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn:"7d"
    })
    return res.status(201).json({
        message: "Logged In Successfully",
        token: token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
      
    }
    
    catch(error){
        return res.status(500).json({message:error.message})
    }
})

router.post("/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
});

module.exports = router;