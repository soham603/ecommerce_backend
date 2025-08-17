import JWT from 'jsonwebtoken';
import userModel from '../models/userModel.js';

// Protected Routes token base
export const requireSignIn = async (req, res, next) => {
  try {
    console.log(req.headers);
    
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing, login required" });
    }

    const decode = JWT.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decode._id);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token, user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("RequireSignIn Error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

//admin access 
export const isAdmin = async (req,res,next) => {
    try {
        const user = await userModel.findById(req.user._id);
        if(user.role !== 1){
            return res.status(401).send({
                sucess: false,
                message: "Unauthorized Access, Not a Admin"
            });
        }
        else {
            next();
        }
    } catch (error) {
        console.log(error);
        res.status({
            sucess:false,
            message: "Error in Middleware"
        });
    }
};

// Optional authentication middleware
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decode = JWT.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decode._id);
    
    if (user) {
      req.user = user;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.log("Invalid token in optional auth:", error.message);
    req.user = null;
    next();
  }
};