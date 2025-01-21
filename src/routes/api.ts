import express from "express";
import { uploadFile } from "../services/uploadImage";
import { authenticateUser } from "../middlewares/auth";


//==================================== Import Controllers ==============================
import * as authControllers from "../controllers/api/authController";
import * as busControllers from "../controllers/api/busController";
import * as cityControllers from "../controllers/api/cityController";

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
router.post("/google-login", authControllers.google_login);

//==================================== GUEST AUTH ==============================
router.get("/guset-login", authControllers.guest_login);

//==================================== CONTACT US ==============================
router.post("/contact-us", authControllers.contactUs);

//==================================== BUS SEARCH ==============================
router.post("/bus-search", busControllers.bus_search);

//==================================== City ===============================
router.post("/search-by-city", cityControllers.searchCities);
router.post("/cities-countries-search", cityControllers.searchCitiesByCountry);

export default router;
