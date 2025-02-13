import Joi from "joi";
import { Request, Response } from "express";
import { getRepository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import moment from 'moment';
import { BusSchedule } from "../../entities/BusSchedule";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { getConnection } from 'typeorm';
import { TicketType } from "../../entities/TicketType";
import { RouteClosure } from "../../entities/RouteClosure";
import { Route_Stops } from "../../entities/RouteStop";

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
        const busScheduleRepository = getRepository(BusSchedule);
        const routeClosureRepository = getRepository(RouteClosure);
        const routeStopsRepository = getRepository(Route_Stops);

        const matchingCityPickupDropPoint = await connection.query('SELECT * FROM ticket_type WHERE startPointCityId = ? AND endPointCityId = ? AND is_active = 1', [pickup_point, dropoff_point]);

        if (!matchingCityPickupDropPoint || matchingCityPickupDropPoint.length === 0) return handleError(res, 200, 'No routes/lines available.');

        const travelDate = moment(travel_date);
        const weekday = travelDate.format('dddd');

        const allBusesForRoutes: BusSchedule[] = await busScheduleRepository.find({
            where: {
                route: In(matchingCityPickupDropPoint.filter((route: any) => route.Baseprice != null).map((route: any) => route.routeRouteId))
            },
            relations: ['bus', 'route'],
        });

        const closedRoutes = await routeClosureRepository.find({
            where: {
                route: In(matchingCityPickupDropPoint.map((route: any) => route.routeRouteId)),
                from_date: LessThanOrEqual(travelDate.toDate()),
                to_date: MoreThanOrEqual(travelDate.toDate())
            }
        });
        const closedRouteIds = closedRoutes.map(route => route.route);

        const busesForSelectedDate: BusScheduleWithTicketType[] = [];

        for (const bus of allBusesForRoutes) {
            if (closedRouteIds.includes(bus.route)) {
                continue;
            }

            let isBusAvailable = false;

            if (!bus.available) {
                if (bus.from && bus.to) {
                    isBusAvailable = moment(travelDate).isBetween(moment(bus.from), moment(bus.to), 'day', '[]');
                }
            } else {
                isBusAvailable = true;
            }

            if (isBusAvailable) {
                if (bus.recurrence_pattern === 'Daily' ||
                    (['Weekly', 'Custom'].includes(bus.recurrence_pattern) && bus.days_of_week?.includes(weekday))) {

                    const routeStopsData = await routeStopsRepository.find({
                        where: { route: { route_id: bus.route.route_id } },
                        relations: ["stop_city"],
                        order: { stop_order: "ASC" },
                    });

                    const pickupStop = await routeStopsRepository.findOne({
                        where: {
                            route: { route_id: bus.route.route_id },
                            stop_city: { city_id: pickup_point }
                        },
                    });

                    const dropoffStop = await routeStopsRepository.findOne({
                        where: {
                            route: { route_id: bus.route.route_id },
                            stop_city: { city_id: dropoff_point }
                        },
                    });

                    if (pickupStop && dropoffStop) {
                        const departureTimeStr = `${travel_date} ${pickupStop?.departure_time || ''}`;
                        const arrivalTimeStr = `${travel_date} ${dropoffStop?.arrival_time || ''}`;

                        const departureTime = moment(departureTimeStr, 'YYYY-MM-DD HH:mm');
                        const arrivalTime = moment(arrivalTimeStr, 'YYYY-MM-DD HH:mm');

                        if (arrivalTime.isBefore(departureTime)) {
                            arrivalTime.add(1, 'days');
                        }

                        const duration = moment.duration(arrivalTime.diff(departureTime));

                        const matchingRoute = matchingCityPickupDropPoint.find((route: any) => route.routeRouteId === bus.route.route_id);

                        busesForSelectedDate.push({
                            ...(bus as any),
                            departure_time: departureTime.format('YYYY-MM-DD HH:mm'),
                            arrival_time: arrivalTime.format('YYYY-MM-DD HH:mm'),
                            duration: `${duration.hours()} hours ${duration.minutes()} minutes`,
                            base_price: matchingRoute || null,
                            route_stops: routeStopsData,
                        });
                    } else {
                        console.error('One of the stops is missing: pickupStop or dropoffStop is null');
                    }
                }
            }
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