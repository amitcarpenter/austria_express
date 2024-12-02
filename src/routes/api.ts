import express from "express";
import { uploadFile } from "../services/uploadImage";
import { authenticateUser } from "../middlewares/auth";


//==================================== Import Controllers ==============================
import * as authControllers from "../controllers/api/authController";

const router = express.Router();

//==================================== AUTH ==============================
router.post("/register", authControllers.register);
router.get("/verify-email", authControllers.verifyEmail);
router.post("/login", authControllers.login_user);
router.post("/forgot-password", authControllers.forgot_password);
router.get("/reset-password", authControllers.render_forgot_password_page);
router.post("/reset-password", authControllers.reset_password);
router.post("/change-password", authenticateUser, authControllers.changePassword);
router.get("/profile", authenticateUser, authControllers.getProfile);
router.post("/profile/update", authenticateUser, uploadFile, authControllers.updateProfile);
router.get("/register-success", authControllers.render_success_register);
router.get("/success-reset", authControllers.render_success_reset);



export default router;
