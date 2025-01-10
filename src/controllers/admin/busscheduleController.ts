import Joi, { any } from "joi";
import { Request, Response } from "express";
import { Between, getRepository } from "typeorm";
import { addHours, format } from 'date-fns';
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { BusSchedule } from "../../entities/BusSchedule";
import { Driver } from "../../entities/Driver";
import { Tbl_Terminal } from "../../entities/Terminal";

export const create_busschedule = async (req: Request, res: Response) => {
    try {
        const createBusscheduleSchema = Joi.object({
            bus_id: Joi.number().required(),
            route_id: Joi.number().required(),
            driver_id: Joi.number().required(),
            departure_time: Joi.string().required(),
            total_running_hours: Joi.number().min(1).required(),
            pickup_terminal_id: Joi.number().required(),
            dropoff_terminal_id: Joi.number().required(),
            recurrence_pattern: Joi.string().valid("Daily", "Weekly", "Custom").required(),
            days_of_week: Joi.string().optional(),
            base_pricing: Joi.string().required()
        });

        const { error, value } = createBusscheduleSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { bus_id, route_id, driver_id, departure_time, total_running_hours, pickup_terminal_id, dropoff_terminal_id, recurrence_pattern, days_of_week, base_pricing } = value;

        const busscheduleRepository = getRepository(BusSchedule);
        const driverRepository = getRepository(Driver);

        const driverRecord = await driverRepository.findOne({ where: { driver_id } });
        if (!driverRecord) return handleError(res, 404, "Driver not found");

        // Check for duplicate schedule
        const duplicateSchedule = await busscheduleRepository.findOne({
            where: {
                bus_id,
                route_id,
                departure_time
            }
        });

        if (duplicateSchedule) return handleError(res, 400, "A bus schedule already exists for the specified bus, route, and date range.");

        // Parse the departure_time and calculate arrival_time
        const currentDate = new Date(); // Current date
        const [hours, minutes] = departure_time.split(':').map(Number);
        const departureDateTime = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            hours,
            minutes
        );

        const arrivalDateTime = addHours(departureDateTime, total_running_hours);

        // Calculate the difference in days
        const daysDifference = Math.floor(total_running_hours / 24);
        const departureTimeFormatted = format(departureDateTime, 'HH:mm');
        const arrivalTimeFormatted = format(arrivalDateTime, 'HH:mm');

        const formattedDuration = Math.floor(total_running_hours) + ':' + String(Math.round((total_running_hours - Math.floor(total_running_hours)) * 60)).padStart(2, '0');

        const noOfDays = daysDifference > 0 ? `+${daysDifference} day${daysDifference > 1 ? 's' : ''}` : '';

        const newBusschedule = busscheduleRepository.create({
            bus_id,
            route_id,
            driver_id,
            departure_time: departureTimeFormatted,
            arrival_time: arrivalTimeFormatted,
            duration_time: formattedDuration,
            no_of_days: noOfDays,
            pickup_terminal_id,
            dropoff_terminal_id,
            recurrence_pattern,
            days_of_week: days_of_week || null, // Default to null if not provided
            base_pricing: JSON.parse(base_pricing),
        });

        await busscheduleRepository.save(newBusschedule);

        return handleSuccess(res, 200, "Bus Schedule Created Successfully.");
    } catch (error: any) {
        console.error("Error in create_bus:", error);
        return handleError(res, 500, error.message);
    }
};

export const get_all_busschedule = async (req: Request, res: Response) => {
    try {
        const busscheduleRepository = getRepository(BusSchedule);

        const busscheduleResult = await busscheduleRepository.find({ relations: ['bus_id', 'route_id', 'driver_id'] });

        if (!busscheduleResult) return handleError(res, 404, 'No bus schedules found');

        busscheduleResult.forEach(item => {
            if (item.base_pricing && typeof item.base_pricing === 'string') {
                try {
                    item.base_pricing = JSON.parse(item.base_pricing);
                } catch (error) {
                    console.error(`Error parsing base_pricing for item with schedule_id ${item.schedule_id}:`, error);
                }
            }
        });

        return handleSuccess(res, 200, 'Bus schedules found successfully', busscheduleResult);
    } catch (error: any) {
        console.error("Error in getAllCity:", error);
        return handleError(res, 500, error.message);
    }
};

export const get_all_busschedule_byid = async (req: Request, res: Response) => {
    try {
        // Define the schema for validating the request body
        const deleteBusscheduleSchema = Joi.object({
            schedule_id: Joi.number().required()
        });

        // Validate the request body against the schema
        const { error, value } = deleteBusscheduleSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { schedule_id } = value;

        // Get the repository for the BusSchedule entity
        const busscheduleRepository = getRepository(BusSchedule);

        // Find the bus schedule by schedule_id and include related entities
        const busscheduleResult = await busscheduleRepository.findOne({
            where: { schedule_id },
            relations: ['bus_id', 'route_id']
        });

        if (!busscheduleResult) {
            // Handle case where no bus schedule is found
            return handleError(res, 404, 'Bus schedule not found');
        }

        const parsedBasePricing = busscheduleResult.base_pricing && typeof busscheduleResult.base_pricing === 'string'
            ? JSON.parse(busscheduleResult.base_pricing)
            : null;

        // Add the parsed data as a new property dynamically
        const resultWithParsedPricing = { ...busscheduleResult, parsedBasePricing };

        // Return the found bus schedule
        return handleSuccess(res, 200, 'Bus schedule successfully found', resultWithParsedPricing)
    } catch (error: any) {
        // Handle unexpected errors
        console.error("Error in get_all_busschedule_byid:", error);
        return handleError(res, 500, error.message);
    }
};

export const update_busschedule = async (req: Request, res: Response) => {
    try {
        const updateBusscheduleSchema = Joi.object({
            schedule_id: Joi.number().required(),
            bus_id: Joi.string().optional(),
            route_id: Joi.string().optional(),
            start_date: Joi.date().required(),
            end_date: Joi.date().optional(),
            departure_time: Joi.string().required(),
            arrival_time: Joi.string().required(),
            recurrence_pattern: Joi.string().valid("Daily", "Weekly", "Custom").required(),
            days_of_week: Joi.string().optional(),
            base_pricing: Joi.string().custom((value, helpers) => {
                try {
                    const parsed = JSON.parse(value);
                    if (!Array.isArray(parsed)) {
                        return helpers.error("any.invalid", { message: "Base pricing must be an array of objects." });
                    }
                    return value;
                } catch {
                    return helpers.error("any.invalid", { message: "Base pricing must be a valid JSON string." });
                }
            })
        });

        const { error, value } = updateBusscheduleSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { schedule_id, bus_id, route_id, start_date, end_date, departure_time, arrival_time, recurrence_pattern, days_of_week, base_pricing } = value;

        const busscheduleRepository = getRepository(BusSchedule);

        // Find the bus schedule by schedule_id
        const busscheduleResult = await busscheduleRepository.findOne({ where: { schedule_id } });

        if (!busscheduleResult) return handleError(res, 404, 'Bus schedule not found');

        // Check if bus_id or route_id already exists (if provided)
        if (bus_id) {
            const existingBus = await busscheduleRepository.find({ where: { bus_id } });
            if (existingBus.length > 1 || (existingBus.length === 1 && existingBus[0].schedule_id !== schedule_id)) {
                return handleError(res, 400, 'Bus ID already exists');
            }
        }

        if (route_id) {
            const existingRoute = await busscheduleRepository.find({ where: { route_id } });
            if (existingRoute.length > 1 || (existingRoute.length === 1 && existingRoute[0].schedule_id !== schedule_id)) {
                return handleError(res, 400, 'Route ID already exists');
            }
        }

        // Proceed with the update
        if (bus_id) busscheduleResult.bus_id = bus_id;
        if (route_id) busscheduleResult.route_id = route_id;
        // if (start_date) busscheduleResult.start_date = start_date;
        // if (end_date) busscheduleResult.end_date = end_date;
        // if (departure_time) busscheduleResult.departure_time = departure_time;
        // if (arrival_time) busscheduleResult.arrival_time = arrival_time;
        // if (recurrence_pattern) busscheduleResult.recurrence_pattern = recurrence_pattern;
        // if (days_of_week) busscheduleResult.days_of_week = days_of_week;
        // if (base_pricing) busscheduleResult.base_pricing = JSON.parse(base_pricing);

        await busscheduleRepository.save(busscheduleResult);

        return handleSuccess(res, 200, 'Bus schedule updated successfully');
    } catch (error: any) {
        console.error("Error in update_busschedule:", error);
        return handleError(res, 500, error.message);
    }
};

export const delete_busschedule = async (req: Request, res: Response) => {
    try {
        const deleteBusscheduleSchema = Joi.object({
            schedule_id: Joi.number().required()
        });

        const { error, value } = deleteBusscheduleSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { schedule_id } = value;

        const busscheduleRepository = getRepository(BusSchedule);

        // Find the bus schedule by schedule_id
        const busscheduleResult = await busscheduleRepository.findOne({ where: { schedule_id } });

        if (!busscheduleResult) return handleError(res, 404, 'Bus schedule not found or already deleted');

        // Delete the bus schedule by schedule_id
        await busscheduleRepository.delete(schedule_id);

        return handleSuccess(res, 200, 'Bus schedule deleted successfully');
    } catch (error: any) {
        console.error("Error in delete_busschedule:", error);
        return handleError(res, 500, error.message);
    }
};