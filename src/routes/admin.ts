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
router.post("/profile/update", authenticateAdmin, uploadFile, authControllers.updateProfile);
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


//==================================== Route ==============================
router.post("/create-route", authenticateAdmin, routeControllers.create_route);
router.get("/get-all-routes", authenticateAdmin, routeControllers.get_all_routes);
router.get("/get-route-by-id", authenticateAdmin, routeControllers.get_route_by_id);
router.post("/update-route", authenticateAdmin, routeControllers.update_route);
router.post("/update-route-status", authenticateAdmin, routeControllers.update_route_status);
router.delete("/delete-route", authenticateAdmin, routeControllers.delete_route);

//==================================== Driver ==============================
router.post("/create-driver", authenticateAdmin, driverControllers.create_driver);
router.get("/get-all-drivers", authenticateAdmin, driverControllers.get_all_drivers);
router.get("/get-driver-by-id", authenticateAdmin, driverControllers.get_driver_by_id);
router.post("/update-driver", authenticateAdmin, driverControllers.update_driver);
router.post("/update-driver-status", authenticateAdmin, driverControllers.update_driver_status);
router.delete("/delete-driver", authenticateAdmin, driverControllers.delete_driver);

//==================================== Bus ==============================
router.post("/create-bus", authenticateAdmin, busControllers.create_bus);
router.get("/get-all-buses", authenticateAdmin, busControllers.get_all_buses);
router.post("/update-bus", authenticateAdmin, busControllers.update_bus);
router.post("/update-bus-status", authenticateAdmin, busControllers.update_bus_status);
router.delete("/delete-bus", authenticateAdmin, busControllers.delete_bus);





export default router;
