import Joi, { any } from "joi";
import { Request, Response } from "express";
import { getRepository, Like } from "typeorm";
import { addHours, format } from 'date-fns';
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { BusSchedule } from "../../entities/BusSchedule";
import { Driver } from "../../entities/Driver";

export const create_busschedule = async (req: Request, res: Response) => {
    try {
        const createBusscheduleSchema = Joi.object({
            bus_id: Joi.number().required(),
            route_id: Joi.number().required(),
            driver_id: Joi.number().required(),
            departure_time: Joi.string().required(),
            total_running_hours: Joi.number().min(1).required(),
            recurrence_pattern: Joi.string().valid("Daily", "Weekly", "Custom").required(),
            days_of_week: Joi.string().optional(),
        });

        const { error, value } = createBusscheduleSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { bus_id, route_id, driver_id, departure_time, total_running_hours, recurrence_pattern, days_of_week } = value;

        const busscheduleRepository = getRepository(BusSchedule);
        const driverRepository = getRepository(Driver);

        const driverRecord = await driverRepository.findOne({ where: { driver_id } });
        if (!driverRecord) return handleError(res, 404, "Driver not found");

        const duplicateSchedule = await busscheduleRepository.findOne({
            where: {
                bus: bus_id,
                route: route_id,
                departure_time
            }
        });
        if (duplicateSchedule) return handleError(res, 400, "A bus schedule already exists for the specified bus, route, and date range.");

        const duplicateDriver = await busscheduleRepository.findOne({
            where: {
                driver: { driver_id: driver_id }
            }
        });
        if (duplicateDriver) return handleError(res, 400, "This driver is already assigned to another bus.");

        const currentDate = new Date();
        const [hours, minutes] = departure_time.split(':').map(Number);
        const departureDateTime = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            hours,
            minutes
        );

        const arrivalDateTime = addHours(departureDateTime, total_running_hours);

        const daysDifference = Math.floor(total_running_hours / 24);
        const departureTimeFormatted = format(departureDateTime, 'HH:mm');
        const arrivalTimeFormatted = format(arrivalDateTime, 'HH:mm');

        const formattedDuration = Math.floor(total_running_hours) + ':' + String(Math.round((total_running_hours - Math.floor(total_running_hours)) * 60)).padStart(2, '0');

        const noOfDays = daysDifference > 0 ? `+${daysDifference} day${daysDifference > 1 ? 's' : ''}` : '';

        const newBusschedule = busscheduleRepository.create({
            bus: bus_id,
            route: route_id,
            driver: driver_id,
            departure_time: departureTimeFormatted,
            arrival_time: arrivalTimeFormatted,
            duration_time: formattedDuration,
            no_of_days: noOfDays,
            recurrence_pattern,
            days_of_week: days_of_week || null,
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
        const { page = 1, limit = 10, search = '', filter = '' } = req.query;

        const pageNumber = parseInt(page as string, 10);
        const pageLimit = parseInt(limit as string, 10);

        const offset = (pageNumber - 1) * pageLimit;

        const busscheduleRepository = getRepository(BusSchedule);

        const whereConditions = [];
        if (search) {
            whereConditions.push(
                { duration_time: Like(`%${search}%`) },
                { departure_time: Like(`%${search}%`) },
                { recurrence_pattern: Like(`%${search}%`) },
                { bus: { bus_name: Like(`%${search}%`) } },
                { bus: { bus_number_plate: Like(`%${search}%`) } }
            );
        }

        if (filter) {
            whereConditions.push(
                { route: { route_direction: Like(`%${filter}%`) } }
            );
        }

        const [busschedule, total] = await busscheduleRepository.findAndCount({
            where: whereConditions.length > 0 ? whereConditions : [],
            relations: ['bus', 'driver', 'route', 'route.pickup_point', 'route.dropoff_point'],
            order: { schedule_id: 'DESC' },
            take: pageLimit,
            skip: offset,
        });

        const totalPages = Math.ceil(total / pageLimit);

        busschedule.forEach(item => {
            const formatTime = (time: string | null | undefined): string => {
                if (!time) {
                    console.warn('Invalid time value:', time);
                    return '00:00';
                }

                const timeParts = time.split(':');
                if (timeParts.length < 2 || timeParts.length > 3) {
                    console.warn('Invalid time format:', time);
                    return '00:00';
                }

                const date = new Date(`1970-01-01T${time}Z`);
                if (isNaN(date.getTime())) {
                    console.warn('Invalid time value:', time);
                    return '00:00';
                }

                return date.toISOString().slice(11, 16);
            };

            item.departure_time = formatTime(item.departure_time);
            item.arrival_time = formatTime(item.arrival_time);
            item.duration_time = formatTime(item.duration_time);
        });

        return handleSuccess(res, 200, 'Bus schedules found successfully', {
            busschedule, pagination: {
                total,
                totalPages,
                currentPage: pageNumber,
                pageSize: pageLimit,
            },
        });
    } catch (error: any) {
        console.error("Error in getAllCity:", error);
        return handleError(res, 500, error.message);
    }
};

export const get_all_busschedule_byid = async (req: Request, res: Response) => {
    try {
        const deleteBusscheduleSchema = Joi.object({
            schedule_id: Joi.number().required()
        });

        const { error, value } = deleteBusscheduleSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { schedule_id } = value;

        const busscheduleRepository = getRepository(BusSchedule);

        const busscheduleResult = await busscheduleRepository.findOne({
            where: { schedule_id },
            relations: ['bus', 'route']
        });

        if (!busscheduleResult) return handleError(res, 404, 'Bus schedule not found');

        return handleSuccess(res, 200, 'Bus schedule successfully found', busscheduleResult)
    } catch (error: any) {
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
        });

        const { error, value } = updateBusscheduleSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { schedule_id, bus_id, route_id, start_date, end_date, departure_time, arrival_time, recurrence_pattern, days_of_week } = value;

        const busscheduleRepository = getRepository(BusSchedule);

        const busscheduleResult = await busscheduleRepository.findOne({ where: { schedule_id } });

        if (!busscheduleResult) return handleError(res, 404, 'Bus schedule not found');

        if (bus_id) {
            const existingBus = await busscheduleRepository.find({ where: { bus: { bus_id: bus_id } } });
            if (existingBus.length > 1 || (existingBus.length === 1 && existingBus[0].schedule_id !== schedule_id)) {
                return handleError(res, 400, 'Bus ID already exists');
            }
        }

        if (route_id) {
            const existingRoute = await busscheduleRepository.find({ where: { route: { route_id: route_id } } });
            if (existingRoute.length > 1 || (existingRoute.length === 1 && existingRoute[0].schedule_id !== schedule_id)) {
                return handleError(res, 400, 'Route ID already exists');
            }
        }

        if (bus_id) busscheduleResult.bus = bus_id;
        if (route_id) busscheduleResult.route = route_id;
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

export const get_all_busschedule_by_route_id = async (req: Request, res: Response) => {
    try {
        const deleteBusscheduleSchema = Joi.object({
            route_id: Joi.number().required()
        });

        const { error, value } = deleteBusscheduleSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { route_id } = value;

        const busscheduleRepository = getRepository(BusSchedule);

        const busscheduleResult = await busscheduleRepository.find({
            where: { route: { route_id } },
            order: { schedule_id: 'DESC' },
            relations: ['bus', 'driver', 'route', 'route.pickup_point', 'route.dropoff_point']
        });

        if (!busscheduleResult) return handleError(res, 404, 'Bus schedule not found');

        busscheduleResult.forEach(item => {
            const formatTime = (time: string | null | undefined): string => {
                if (!time) {
                    console.warn('Invalid time value:', time);
                    return '00:00';
                }

                const timeParts = time.split(':');
                if (timeParts.length < 2 || timeParts.length > 3) {
                    console.warn('Invalid time format:', time);
                    return '00:00';
                }

                const date = new Date(`1970-01-01T${time}Z`);
                if (isNaN(date.getTime())) {
                    console.warn('Invalid time value:', time);
                    return '00:00';
                }

                return date.toISOString().slice(11, 16);
            };

            item.departure_time = formatTime(item.departure_time);
            item.arrival_time = formatTime(item.arrival_time);
            item.duration_time = formatTime(item.duration_time);
        });
        return handleSuccess(res, 200, 'Bus schedule successfully found', busscheduleResult)
    } catch (error: any) {
        console.error("Error in get_all_busschedule_by_route_id:", error);
        return handleError(res, 500, error.message);
    }
};