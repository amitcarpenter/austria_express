import express from "express";
import { uploadFile } from "../services/uploadImage";
import { authenticateAdmin } from "../middlewares/auth";

//==================================== Import Controller ==============================
import * as authControllers from "../controllers/admin/authController";
import * as userControllers from "../controllers/admin/userController";
import * as roleControllers from "../controllers/role/roleController";
import * as routeControllers from "../controllers/admin/routeController";
import * as driverControllers from "../controllers/admin/driverController";
import * as busControllers from "../controllers/admin/busController";
import * as busscheduleControllers from "../controllers/admin/busscheduleController";
import * as cityControllers from "../controllers/admin/cityController";
import { get_lat_long } from "../utils/latlong";
import { get_location } from "../utils/searchLocation";

const router = express.Router();

//==================================== Auth ==============================
router.post("/register", authControllers.register_admin);
router.get("/verify-email", authControllers.verifyEmail);
router.post("/login", authControllers.login_admin);
router.post("/forgot-password", authControllers.forgot_password);
router.get("/reset-password", authControllers.render_forgot_password_page);
router.post("/reset-password", authControllers.reset_password);
router.post("/change-password", authenticateAdmin, authControllers.changePassword);
router.get("/profile", authenticateAdmin, authControllers.getProfile);
router.post("/profile-update", authenticateAdmin, uploadFile, authControllers.updateProfile);
router.get("/register-success", authControllers.render_success_register);
router.get("/success-reset", authControllers.render_success_reset);
// router.get("/dashboard-details", authenticateAdmin, authControllers.dashboard_details);


//==================================== USER ==============================
router.get("/user-list", authenticateAdmin, userControllers.get_all_user_list);
router.post("/change-user-status", authenticateAdmin, userControllers.change_user_status);


//==================================== USER ==============================
router.get("/get-all-users", userControllers.getAllUsers);


//==================================== Role ==============================
router.post("/create-role", roleControllers.RolesController.createRole);
router.post("/get-roles", roleControllers.RolesController.getAllRoles);
router.post("/update-role", roleControllers.RolesController.updateRole);
router.post("/delete-role", roleControllers.RolesController.deleteRole);

//==================================== City ===============================
router.post("/create-city", cityControllers.createCity);
router.get("/get-all-city", cityControllers.getAllCity);
router.post("/update-city", cityControllers.updateCity);
router.post("/delete-city", cityControllers.deleteCityById);
router.post("/get-cityby-countryname", cityControllers.getCityByCountryName);

//==================================== City Terminal ===============================
router.post("/create-city-terminal", cityControllers.createCityTerminal);
router.get("/get-all-city-terminal", cityControllers.getAllCityTerminal);
router.post("/get-city-terminal-id", cityControllers.getCityTerminalById);
router.post("/update-city-terminal-id", cityControllers.updateCityTerminalById);
router.post("/delete-city-terminal-id", cityControllers.deleteCityTerminalById);

//==================================== Route ==============================
router.post("/create-route", authenticateAdmin, routeControllers.create_route);
router.get("/get-all-routes", authenticateAdmin, routeControllers.get_all_routes);
router.post("/get-route-by-id", authenticateAdmin, routeControllers.get_route_by_id);
router.post("/update-route", authenticateAdmin, routeControllers.update_route);
router.post("/update-route-status", authenticateAdmin, routeControllers.update_route_status);
router.delete("/delete-route", authenticateAdmin, routeControllers.delete_route);

//==================================== Driver ==============================
router.post("/create-driver", authenticateAdmin, uploadFile, driverControllers.create_driver);
router.get("/get-all-drivers", authenticateAdmin, driverControllers.get_all_drivers);
router.post("/get-driver-by-id", authenticateAdmin, driverControllers.get_driver_by_id);
router.post("/update-driver", authenticateAdmin, uploadFile, driverControllers.update_driver);
router.post("/update-driver-status", authenticateAdmin, driverControllers.update_driver_status);
router.delete("/delete-driver", authenticateAdmin, driverControllers.delete_driver);

//==================================== Bus ==============================
router.post("/create-bus", authenticateAdmin, busControllers.create_bus);
router.get("/get-all-buses", authenticateAdmin, busControllers.get_all_buses);
router.post("/update-bus", authenticateAdmin, busControllers.update_bus);
router.post("/update-bus-status", authenticateAdmin, busControllers.update_bus_status);
router.delete("/delete-bus", authenticateAdmin, busControllers.delete_bus);

//==================================== Bus Schedule ==============================
router.post("/create-busschedule", authenticateAdmin, busscheduleControllers.create_busschedule);
router.get("/get-all-busschedule", authenticateAdmin, busscheduleControllers.get_all_busschedule);
router.post("/get-busschedule-byid", authenticateAdmin, busscheduleControllers.get_all_busschedule_byid);
router.post("/update-busschedule", authenticateAdmin, busscheduleControllers.update_busschedule);
router.delete("/delete-busschedule", authenticateAdmin, busscheduleControllers.delete_busschedule);

//=================================== Lat Long ==========================
router.post("/get-lat-long", get_lat_long);

//=================================== Search Location ==========================
router.post("/get-location", get_location);

export default router;
