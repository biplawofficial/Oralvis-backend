const jwt=require("jsonwebtoken")

function auth(reqrole){
    return (req,res,next)=>{
        const token=req.headers["authorization"]?.split(" ")[1];
        if(!token) return res.status(401).json({message:"No Token Provided!"})
        jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{
            if(err) return res.status(403).json({message:err})
            req.user=user
            if(reqrole && user.role!==reqrole){
                return res.status(403).json({message:"Access Denied!"})
            }
            next();
        })
    }
}
module.exports=auth;