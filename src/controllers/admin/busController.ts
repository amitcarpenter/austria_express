import Joi from "joi";
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Bus } from "../../entities/Bus";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { Route } from "../../entities/Route";
import { Driver } from "../../entities/Driver";


export const create_bus = async (req: Request, res: Response) => {
    try {
        const createBusSchema = Joi.object({
            bus_name: Joi.string().required(),
            bus_number: Joi.string().required(),
            total_seats: Joi.number().integer().min(1).required(),
            route_id: Joi.number().required(),
            driver_id: Joi.number().required(),
            is_active: Joi.boolean().optional(),
            registration_number: Joi.string().optional(),
            insurance_expiry_date: Joi.date().optional(),
        });

        const { error, value } = createBusSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { bus_name, bus_number, total_seats, route_id, is_active, registration_number, insurance_expiry_date, driver_id } = value;

        const busRepository = getRepository(Bus);


        const routeRepository = getRepository(Route);
        const driverRepository = getRepository(Driver);


        const route = await routeRepository.findOneBy({ route_id: route_id })
        if (!route) return handleError(res, 404, "Route Not Found")

        const driver = await driverRepository.findOneBy({ driver_id: driver_id })
        if (!driver) return handleError(res, 404, "Driver Not Found")

        const newBus = busRepository.create({
            bus_name,
            bus_number,
            total_seats,
            route: route,
            is_active,
            registration_number,
            insurance_expiry_date,
            driver: driver,
        });

        await busRepository.save(newBus);

        return handleSuccess(res, 200, "Bus Created Successfully.");
    } catch (error: any) {
        console.error("Error in create_bus:", error);
        return handleError(res, 500, error.message);
    }
};


export const get_all_buses = async (req: Request, res: Response) => {
    try {
        const busRepository = getRepository(Bus);
        const buses = await busRepository.find({ relations: ["route", "driver"] });
        return handleSuccess(res, 200, "Buses fetched successfully.", buses);
    } catch (error: any) {
        console.error("Error in get_all_buses:", error);
        return handleError(res, 500, error.message);
    }
};


export const update_bus = async (req: Request, res: Response) => {
    try {
        const updateBusSchema = Joi.object({
            bus_id: Joi.number().optional(),
            bus_name: Joi.string().optional(),
            bus_number: Joi.string().optional(),
            total_seats: Joi.number().integer().optional(),
            route_id: Joi.number().optional(),
            is_active: Joi.boolean().optional(),
            registration_number: Joi.string().optional(),
            insurance_expiry_date: Joi.date().optional(),
            driver_id: Joi.number().optional(),
        });

        const { error, value } = updateBusSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const busRepository = getRepository(Bus);
        const { route_id, driver_id, bus_id, bus_name, bus_number, total_seats, is_active, registration_number, insurance_expiry_date } = value;
        const bus = await busRepository.findOneBy({ bus_id: bus_id });
        if (!bus) return handleError(res, 404, "Bus not found.");

        const routeRepository = getRepository(Route);
        const driverRepository = getRepository(Driver);

        if (route_id) {
            const route = await routeRepository.findOneBy({ route_id: route_id });
            if (!route) return handleError(res, 404, "Route Not Found");
            bus.route = route;
        }

        if (driver_id) {
            const driver = await driverRepository.findOneBy({ driver_id: driver_id });
            if (!driver) return handleError(res, 404, "Driver Not Found");
            bus.driver = driver;
        }


        if (bus_name) bus.bus_name = bus_name;
        if (bus_number) bus.bus_number = bus_number;
        if (total_seats) bus.total_seats = total_seats;
        if (registration_number) bus.registration_number = registration_number;
        if (insurance_expiry_date) bus.insurance_expiry_date = insurance_expiry_date;

        await busRepository.save(bus);

        return handleSuccess(res, 200, "Bus Updated Successfully.");
    } catch (error: any) {
        console.error("Error in update_bus:", error);
        return handleError(res, 500, error.message);
    }
};


export const update_bus_status = async (req: Request, res: Response) => {
    try {
        const updateBusSchema = Joi.object({
            bus_id: Joi.number().required(),
            is_active: Joi.boolean().required(),
        });

        const { error, value } = updateBusSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const busRepository = getRepository(Bus);
        const { bus_id, is_active} = value;
        const bus = await busRepository.findOneBy({ bus_id: bus_id });
        if (!bus) return handleError(res, 404, "Bus not found.");

        
        let response_message = 'Bus Activated Successfully '
        if (!is_active) response_message = 'Bus De-activated Successfully'
        bus.is_active = is_active

        
        await busRepository.save(bus);

        return handleSuccess(res, 200, response_message);
    } catch (error: any) {
        console.error("Error in update_bus:", error);
        return handleError(res, 500, error.message);
    }
};


export const delete_bus = async (req: Request, res: Response) => {
    try {
        const deleteBusSchema = Joi.object({
            bus_id: Joi.number().required()
        });

        const { error, value } = deleteBusSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { bus_id } = value;

        const busRepository = getRepository(Bus);
        const bus = await busRepository.findOneBy({ bus_id: bus_id });
        if (!bus) return handleError(res, 404, "Bus not found.");

        await busRepository.remove(bus);

        return handleSuccess(res, 200, "Bus Deleted Successfully.");
    } catch (error: any) {
        console.error("Error in delete_bus:", error);
        return handleError(res, 500, error.message);
    }
};
