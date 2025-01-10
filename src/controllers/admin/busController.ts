import Joi from "joi";
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Bus } from "../../entities/Bus";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";

export const create_bus = async (req: Request, res: Response) => {
    try {
        const createBusSchema = Joi.object({
            bus_name: Joi.string().required(),
            bus_number_plate: Joi.string().required(),
            bus_registration_number: Joi.string().required(),
            number_of_seats: Joi.number().integer().min(1).required(),
        });

        const { error, value } = createBusSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { bus_name, bus_number_plate, bus_registration_number, number_of_seats } = value;

        const busRepository = getRepository(Bus);

        const newBus = busRepository.create({
            bus_name,
            bus_number_plate,
            bus_registration_number,
            number_of_seats
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
        const buses = await busRepository.find();
        return handleSuccess(res, 200, "Buses fetched successfully.", buses);
    } catch (error: any) {
        console.error("Error in get_all_buses:", error);
        return handleError(res, 500, error.message);
    }
};

export const update_bus = async (req: Request, res: Response) => {
    try {
        const updateBusSchema = Joi.object({
            bus_id: Joi.number().required(),
            bus_name: Joi.string().required(),
            bus_number_plate: Joi.string().required(),
            bus_registration_number: Joi.string().required(),
            number_of_seats: Joi.number().integer().min(1).required(),
        });

        const { error, value } = updateBusSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const busRepository = getRepository(Bus);
        const { bus_id, bus_name, bus_number_plate, bus_registration_number, number_of_seats } = value;
        const bus = await busRepository.findOneBy({ bus_id: bus_id });
        if (!bus) return handleError(res, 404, "Bus not found.");

        if (bus_name) bus.bus_name = bus_name;
        if (bus_number_plate) bus.bus_number_plate = bus_number_plate;
        if (bus_registration_number) bus.bus_registration_number = bus_registration_number;
        if (number_of_seats) bus.number_of_seats = number_of_seats;

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
        const { bus_id, is_active } = value;
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