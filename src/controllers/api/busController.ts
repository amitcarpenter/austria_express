import Joi from "joi";
import { Request, Response } from "express";
import { getRepository, In, MoreThanOrEqual, LessThanOrEqual, MoreThan, Like, Raw } from 'typeorm';
import { BusSchedule } from "../../entities/BusSchedule";
import { Route } from '../../entities/Route';
import { City } from "../../entities/City";
import { Terminal } from "../../entities/Terminal";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { getNextDay } from "../../utils/function";


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

        const busscheduleRepository = getRepository(BusSchedule);
        const routeRepository = getRepository(Route);
        const cityRepository = getRepository(City);
        const terminalRepository = getRepository(Terminal);

        const matchingCityPickupPoint = await cityRepository.findOne({ where: { city_id: pickup_point } });
        const matchingTerminalPickupPoint = await terminalRepository.findOne({ where: { terminal_id: pickup_point } });

        const matchingCityDropPoint = await cityRepository.findOne({ where: { city_id: dropoff_point } });
        const matchingTerminalDropoffPoint = await terminalRepository.findOne({ where: { terminal_id: dropoff_point } });

        let matchingRoutes: { route_id: number }[] = [];
        let allBusesForRoutes;

        if (matchingCityPickupPoint != null && matchingCityDropPoint != null) {
            matchingRoutes = await routeRepository.find({
                where: {
                    pickup_point: { city_id: matchingCityPickupPoint?.city_id },
                    dropoff_point: { city_id: matchingCityDropPoint?.city_id }
                },
                relations: ['pickup_point', 'dropoff_point']
            });
        }

        const travelDate = new Date(travel_date);
        const weekday = travelDate.toLocaleString('en-US', { weekday: 'long' });
        console.log(weekday)
        console.log(travelDate)
        console.log("###########")
        if (matchingRoutes.length > 0) {
            allBusesForRoutes = await busscheduleRepository.find({
                where: {
                    route: In(matchingRoutes.map(route => route.route_id))
                },
                order: {
                    departure_time: "DESC",
                },
                relations: ['pickup_terminal', 'dropoff_terminal', 'pickup_terminal.city', 'dropoff_terminal.city']
            });
        } else if (matchingTerminalPickupPoint != null && matchingTerminalDropoffPoint != null) {
            allBusesForRoutes = await busscheduleRepository.find({
                where: {
                    pickup_terminal: { terminal_id: matchingTerminalPickupPoint?.terminal_id },
                    dropoff_terminal: { terminal_id: matchingTerminalDropoffPoint?.terminal_id }
                },
                order: {
                    departure_time: "DESC",
                },
                relations: ['pickup_terminal', 'dropoff_terminal', 'pickup_terminal.city', 'dropoff_terminal.city',]
            });
        } else {
            return handleError(res, 404, 'No buses available for the selected route.');
        }

        if (!allBusesForRoutes || allBusesForRoutes.length === 0) return handleError(res, 404, 'No buses available for the selected route.');

        const busesForSelectedDate = allBusesForRoutes.filter(bus => {
            if (bus.recurrence_pattern === 'Daily') return true;
            if (bus.recurrence_pattern === 'Weekly' || bus.recurrence_pattern === 'Custom') {
                return bus.days_of_week?.includes(weekday);
            }
            return false;
        });

        // if (!busesForSelectedDate.length) {
        //     const nextDayDate = getNextDay(travelDate);
        //     const nextDayWeekday = nextDayDate.toLocaleString('en-US', { weekday: 'long' });

        //     let nextAvailableBuses
        //     if (matchingRoutes.length > 0) {
        //         nextAvailableBuses = await busscheduleRepository.find({
        //             where: {
        //                 route: In(matchingRoutes.map(route => route.route_id)),
        //                 days_of_week: Raw(
        //                     (alias) => `FIND_IN_SET('${nextDayWeekday}', ${alias}) > 0`
        //                 )
        //             },
        //             order: {
        //                 departure_time: "DESC",
        //             },
        //             relations: ['pickup_terminal', 'dropoff_terminal']
        //         });
        //     } else {
        //         nextAvailableBuses = await busscheduleRepository.find({
        //             where: {
        //                 pickup_terminal: { terminal_id: matchingTerminalPickupPoint?.terminal_id },
        //                 dropoff_terminal: { terminal_id: matchingTerminalDropoffPoint?.terminal_id },
        //                 days_of_week: Raw(
        //                     (alias) => `FIND_IN_SET('${nextDayWeekday}', ${alias}) > 0`
        //                 )
        //             },
        //             order: {
        //                 departure_time: "DESC",
        //             },
        //             relations: ['pickup_terminal', 'dropoff_terminal']
        //         });
        //     }

        //     if (!nextAvailableBuses.length) return handleError(res, 404, "No buses available for the selected date or in the near future.");

        //     nextAvailableBuses.forEach(item => {
        //         if (item.base_pricing && typeof item.base_pricing === 'string') {
        //             try {
        //                 item.base_pricing = JSON.parse(item.base_pricing);
        //             } catch (error) {
        //                 console.error(`Error parsing base_pricing for item with schedule_id ${item.schedule_id}:`, error);
        //             }
        //         }
        //     });

        //     return handleSuccess(res, 200, "Next available buses found.", nextAvailableBuses);
        // }

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

