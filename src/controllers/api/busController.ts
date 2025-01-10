import Joi from "joi";
import { Request, Response } from "express";
import { getRepository, In, MoreThanOrEqual, LessThanOrEqual, MoreThan, Like, Raw } from 'typeorm';
import { BusSchedule } from "../../entities/BusSchedule";
import { Route } from '../../entities/Route';
import { Tbl_City } from "../../entities/City";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";

export const bus_search = async (req: Request, res: Response) => {
    try {
        const createBusSchema = Joi.object({
            pickup_point: Joi.string().required(),
            dropoff_point: Joi.string().required(),
            travel_date: Joi.string().required()
        });

        const { error, value } = createBusSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { pickup_point, dropoff_point, travel_date } = value;

        const busRepository = getRepository(BusSchedule);
        const routeRepository = getRepository(Route);
        const cityRepository = getRepository(Tbl_City);

        // Fetch matching pickup and dropoff points
        const matchingPickupPoint = await cityRepository.findOne({ where: { city_name: pickup_point } });
        if (!matchingPickupPoint) return handleError(res, 404, "The pickup point city not found.");

        const matchingDropPoint = await cityRepository.findOne({ where: { city_name: dropoff_point } });
        if (!matchingDropPoint) return handleError(res, 404, "The dropoff point city not found.");

        // Fetch routes based on matching pickup and dropoff points
        const matchingRoutes = await routeRepository.find({
            where: {
                pickup_point: { city_id: matchingPickupPoint.city_id },
                dropoff_point: { city_id: matchingDropPoint.city_id }
            },
            relations: ['pickup_point', 'dropoff_point']  // Ensure relations are loaded
        });

        if (!matchingRoutes.length) return handleError(res, 404, "No routes found for the provided pickup and dropoff points.");

        // Convert travel_date to Date object for comparison
        const travelDate = new Date(travel_date);
        const weekday = travelDate.toLocaleString('en-US', { weekday: 'long' });

        // Find buses available for the selected date
        const allBusesForRoutes = await busRepository.find({
            where: {
                route_id: In(matchingRoutes.map(route => route.route_id))
            },
            order: {
                departure_time: "DESC", // Sort by departure time for buses on the same date
            }
        });

        const busesForSelectedDate = allBusesForRoutes.filter(bus => {
            if (bus.recurrence_pattern === 'Daily') {
                return true; // Include daily buses
            }
            if (bus.recurrence_pattern === 'Weekly' || bus.recurrence_pattern === 'Custom') {
                return bus.days_of_week?.includes(weekday); // Check if the weekday is in days_of_week
            }
            return false; // Exclude if it doesn't match any pattern
        });

        if (!busesForSelectedDate.length) {

            const nextDayDate = getNextDay(travelDate);

            const nextDayWeekday = nextDayDate.toLocaleString('en-US', { weekday: 'long' });

            // Find the next available buses based on the days_of_week field
            const nextAvailableBuses = await busRepository.find({
                where: {
                    route_id: In(matchingRoutes.map(route => route.route_id)),
                    days_of_week: Raw(
                        (alias) => `FIND_IN_SET('${nextDayWeekday}', ${alias}) > 0`
                    )
                },
                order: {
                    departure_time: "DESC", // Sort by departure time for buses on the same date
                }
            });

            if (!nextAvailableBuses.length) return handleError(res, 404, "No buses available for the selected date or in the near future.");

            nextAvailableBuses.forEach(item => {
                if (item.base_pricing && typeof item.base_pricing === 'string') {
                    try {
                        item.base_pricing = JSON.parse(item.base_pricing);
                    } catch (error) {
                        console.error(`Error parsing base_pricing for item with schedule_id ${item.schedule_id}:`, error);
                    }
                }
            });

            return handleSuccess(res, 200, "Next available buses found.", nextAvailableBuses);
        }

        busesForSelectedDate.forEach(item => {
            if (item.base_pricing && typeof item.base_pricing === 'string') {
                try {
                    item.base_pricing = JSON.parse(item.base_pricing);
                } catch (error) {
                    console.error(`Error parsing base_pricing for item with schedule_id ${item.schedule_id}:`, error);
                }
            }
        });

        return handleSuccess(res, 200, "Buses found successfully for the selected date.", busesForSelectedDate);
    } catch (error: any) {
        console.error("Error in bus_search:", error);
        return handleError(res, 500, error.message);
    }
};

const getNextDay = (currentDate: Date): Date => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1); // Add 1 day to the current date
    return nextDay;
};