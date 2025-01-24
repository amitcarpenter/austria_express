import Joi from "joi";
import { Request, Response } from "express";
import { getRepository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import moment from 'moment';
import { BusSchedule } from "../../entities/BusSchedule";
import { Route } from '../../entities/Route';
import { City } from "../../entities/City";
import { RouteClosure } from "../../entities/RouteClosure";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { getConnection } from 'typeorm';
import { TicketType } from "../../entities/TicketType";

export interface BusScheduleWithTicketType extends BusSchedule {
    ticket_type: TicketType[];
}

export const bus_search = async (req: Request, res: Response) => {
    try {
        const createBusSchema = Joi.object({
            pickup_point: Joi.string().required(),
            dropoff_point: Joi.string().required(),
            travel_date: Joi.string().required(),
        });

        const { error, value } = createBusSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { pickup_point, dropoff_point, travel_date } = value;

        const connection = await getConnection();
        const busscheduleRepository = getRepository(BusSchedule);
        const routeRepository = getRepository(Route);
        const cityRepository = getRepository(City);
        const routeClosureRepository = getRepository(RouteClosure);

        const matchingCityPickupPoint = await cityRepository.findOne({ where: { city_id: pickup_point } });
        const matchingCityDropPoint = await cityRepository.findOne({ where: { city_id: dropoff_point } });

        let allBusesForRoutes: BusSchedule[] = [];
        const travelDate = moment(travel_date);
        const weekday = travelDate.format('dddd');
        const currentDate = moment().startOf('day');

        if (matchingCityPickupPoint && matchingCityDropPoint) {
            const matchingRoutes = await routeRepository.find({
                where: {
                    // pickup_point: { city_id: matchingCityPickupPoint.city_id },
                    // dropoff_point: { city_id: matchingCityDropPoint.city_id },
                    is_deleted: false,
                },
            });

            if (matchingRoutes.length > 0) {
                allBusesForRoutes = await busscheduleRepository.find({
                    where: {
                        route: In(matchingRoutes.map(route => route.route_id)),
                    },
                    order: { departure_time: "DESC" },
                    relations: ['bus', 'route', 'route.pickup_point', 'route.dropoff_point'],
                });
            } else {
                return handleError(res, 200, 'No buses available for the selected route.');
            }
        } else {
            return handleError(res, 200, 'No buses available for the selected route.');
        }

        const busesForSelectedDate: BusScheduleWithTicketType[] = [];
        for (const bus of allBusesForRoutes) {
            const busDepartureTime = moment(`${moment().format('YYYY-MM-DD')} ${bus.departure_time}`, 'YYYY-MM-DD HH:mm:ss');
            const currentTime = moment();

            const isRouteClosed = await routeClosureRepository.findOne({
                where: {
                    route: { route_id: bus.route.route_id },
                    from_date: LessThanOrEqual(moment(travel_date).toDate()),
                    to_date: MoreThanOrEqual(moment(travel_date).toDate()),
                },
            });
            
            if (isRouteClosed != null) return handleError(res, 200, 'No buses available for the selected date.');;

            if (travelDate.isSame(currentDate, 'day')) {
                if (busDepartureTime.isAfter(currentTime.add(1, 'hours'))) {
                    if (bus.recurrence_pattern === 'Daily') {
                        busesForSelectedDate.push(bus as BusScheduleWithTicketType);
                    } else if (['Weekly', 'Custom'].includes(bus.recurrence_pattern) && bus.days_of_week?.includes(weekday)) {
                        busesForSelectedDate.push(bus as BusScheduleWithTicketType);
                    }
                }
            } else if (travelDate.isAfter(currentDate, 'day')) {
                if (bus.recurrence_pattern === 'Daily') {
                    busesForSelectedDate.push(bus as BusScheduleWithTicketType);
                } else if (['Weekly', 'Custom'].includes(bus.recurrence_pattern) && bus.days_of_week?.includes(weekday)) {
                    busesForSelectedDate.push(bus as BusScheduleWithTicketType);
                }
            }

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

            bus.departure_time = formatTime(bus.departure_time);
            bus.arrival_time = formatTime(bus.arrival_time);

            const ticket_type = await connection.query(
                `SELECT * FROM ticket_type WHERE routeRouteId = ${bus.route.route_id}`
            );
            (bus as BusScheduleWithTicketType).ticket_type = ticket_type;
        }

        if (!busesForSelectedDate.length) {
            return handleError(res, 200, 'No buses available for the selected date.');
        }

        return handleSuccess(res, 200, 'Buses found successfully for the selected date.', busesForSelectedDate);
    } catch (error: any) {
        console.error('Error in bus_search:', error);
        return handleError(res, 500, error.message);
    }
};