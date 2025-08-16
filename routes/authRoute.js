import express from 'express';
import { registerController , loginController, testController, forgotPasswordController, updateProfileController, getOrdersController, getAllOrdersController, orderUpdateController } from "../controllers/authController.js";
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js';

//router object
const router = express.Router();

//routing

//1. Register || Method: Post
router.post('/register', registerController);

//2. Login || Method: Post
router.post('/login', loginController);

//3. Forgot Password || Post
router.post('/forgot-password', forgotPasswordController);


//test route
router.get('/test' , requireSignIn, isAdmin, testController);

//protected User route auth admin
router.get('/user-auth', requireSignIn, (req,res) => {
    res.status(200).send({ok : true});
});

//protected Admin auth route admin
router.get('/admin-auth', requireSignIn,isAdmin, (req,res) => {
    res.status(200).send({ok : true});
});

// update profile
router.put('/profile', requireSignIn, updateProfileController);

// get orders
router.get('/orders', requireSignIn, getOrdersController);

// get all orders
router.get('/all-orders', requireSignIn, getAllOrdersController);

// order status update
router.put('/order-update/:orderId', orderUpdateController);

export default router;