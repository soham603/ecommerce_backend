import userModel from "../models/userModel.js";
import OrderModel from "../models/OrderModel.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";


export const registerController = async (req,res) => {
    try {
        const {name, email, password,phone,address,answer} = req.body;
        //validations:
        if(!name){
            return res.send({message:"Name is required"});
        }; 
        if(!email){
            return res.send({message:"Email is required"});
        }; 
        if(!password){
            return res.send({message:"Password is required"});
        }; 
        if(!phone){
            return res.send({message:"Phone is required"});
        }; 
        if(!address){
            return res.send({message:"Address is required"});
        }; 
        if(!answer){
            return res.send({message:"Answer is required"});
        }; 

        //exister user
        const existuser = await userModel.findOne({email});
        if(existuser) {
            return res.status(200).send({
                sucess:false,
                message:'Already Register please login',
            });
        };

        //register user
        //1. Password hash
        const hashedPassword = await hashPassword(password);

        //2.Save New User: new document
        const user = await new userModel({name,email,phone,address,password:hashedPassword,answer}).save();
        res.status(201).send({
           success:true,
            message:'User Registered Sucessfully',
            user
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            sucess:false,
            message:'Error in Registration',
            error
        })
    }
};

//2. Login Post Controller
export const loginController = async (req,res) => {
    try {
        const {email,password} = req.body;

        //validation
        if(!email || !password){
            return res.status(404).send({
                success:false,
                message:'Incorrect email or password'
            });
        };

        //match credentials and decrypt password
        const user = await userModel.findOne({email});
        if(!user){
            return res.status(400).send({
                sucess:false,
                message:'User Not Found'
            });
        };
        const match = await comparePassword(password, user.password);
        if(!match) {
            return res.status(200).send({
                sucess:false,
                message:'Invalid Password'
            });
        };

        // if match then create token
        const token = await JWT.sign({_id:user._id}, process.env.JWT_SECRET, {
            expiresIn: "5d",
        });
        res.status(200).send({
            success:true,
            message:'Login Sucessfully',
            user:{
                // name:user.name,
                // email:user.email,
                // _id: user._id,
                // address: user.address,
                // phone: user.phone,
                // role: user.role,
                user: user,    
            },
            token,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
           sucess:false,
           message:'Error in Login',
           error 
        });
    }
};


// Forgot Password:
export const forgotPasswordController = async(req,res) => {
    try {
        const {email, answer , newPassword} = req.body;
        if(!email){
            res.status(400).send({message: 'Email is Required'});
        }
        if(!answer){
            res.status(400).send({message: 'Answer is required is Required'});
        }
        if(!newPassword){
            res.status(400).send({message: 'New Password is Required'});
        }

        //check

        const user = await userModel.findOne({email,answer});

        //validate
        if (!user) {
            res.status(404).send({
                success: false,
                message: 'User Not Found'
            });
        }

        const hashNewPassword = await hashPassword(newPassword);

        await userModel.findByIdAndUpdate(user._id, {password: hashNewPassword});
        res.status(200).send({
           success: true,
           message: "Password Reset Successfully" ,
        });
        
        

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Something went wrong',
        });
    }
}

// testController:
export const testController = (req,res) => {
    res.send(
        "Protected Route"
    );
};


// update profile
export const updateProfileController = async(req,res) => {
    try {
        const { name , email , password , address , phone } = req.body;
        const user = await userModel.findById(req.user._id);
        // password
        if (!password && password.length < 6)
        {
            return res.json({error: 'Password is required and 6 characters long'});
        }
        const hasheddPassword = password ? await hashPassword(password) : undefined;
        const updatedUser = await userModel.findByIdAndUpdate(
            req.user._id, 
            {
            name: name || user.name,
            password: hasheddPassword || user.password,
            phone: phone || user.phone,
            address: address || user.address
            },
            { new:true }
        );
        res.status(200).send({
            success: true,
            message: 'Profile is Updated Successfully',
            updatedUser
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Something went wrong',
        });
    }
};

// orders of users
export const getOrdersController = async(req,res) => {
    try {
        const orders = await OrderModel.find({ buyer: req.user._id }).populate("products", "-photo").populate("buyer", "name");
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while getting Orders",
            error
        });
    }
};

// get all orders
export const getAllOrdersController = async (req, res) => {
    try {
        const orders = await OrderModel.find({})
            .populate("products", "-photo")
            .populate("buyer", "name")
            .sort({ createdAt: -1 }); // Corrected sorting parameter
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while getting Orders",
            error
        });
    }
};


export const orderUpdateController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const orders = await OrderModel.findByIdAndUpdate(orderId, {status}, {new:true});
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while getting Orders",
            error
        });
    }
};
