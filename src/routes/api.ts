import express from "express";
import { uploadFile } from "../services/uploadImage";
import { authenticateUser } from "../middlewares/auth";


//==================================== Import Controllers ==============================
import * as authControllers from "../controllers/api/authController";
import * as busControllers from "../controllers/api/busController";
import * as cityControllers from "../controllers/api/cityController";
import * as cityControllersAdmin from "../controllers/admin/cityController";
import * as bookingController from "../controllers/api/bookingController";
import * as ticketTypeControllers from "../controllers/api/ticketTypeController";
import * as paymentControllers from "../controllers/api/paymentController";

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
router.get("/get-all-city", cityControllers.getAllCity);

//======================== Cities ======================================
router.get("/get-all-city", cityControllersAdmin.getAllActiveCity);

//==================================== Booking ==============================
router.post("/create-booking", authenticateUser, bookingController.create_booking);
router.get("/get-ticket-booking-by-booking-id", authenticateUser, bookingController.getTicketBookingByBookingId);

//==================================== Ticket Type ==============================
router.post("/get-ticket-type-by-routeid", authenticateUser, ticketTypeControllers.get_ticket_type_by_routeid);

//==================================== Payment ==============================
router.post("/create-stripe-checkout-session", authenticateUser, paymentControllers.createStripeCheckoutSession);
router.get("/create-liqpay-checkout-session", authenticateUser, paymentControllers.createLiqpayCheckoutSession)

export default router;