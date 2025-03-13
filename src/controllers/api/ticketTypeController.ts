import { Request, Response } from "express";
import Joi from "joi";
import { getRepository } from "typeorm";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { Route } from "../../entities/Route";
import { getConnection } from 'typeorm';

export const get_ticket_type_by_routeid = async (req: Request, res: Response) => {
    try {
        const ticketTypeSchema = Joi.object({
            route_id: Joi.number().required(),
            pickup_point: Joi.number().allow(null, ''),
            dropoff_point: Joi.number().allow(null, '')
        });

        const { error, value } = ticketTypeSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const connection = await getConnection();
        const routeRepository = getRepository(Route);

        const findRoutes = await routeRepository.find({ where: { route_id: value.route_id } });
        if (!findRoutes.length) return handleSuccess(res, 404, "No routes found for the given route ID", []);

        const newTicketTypes = await Promise.all(
            findRoutes.map(async (val) => {
                var ticket_type
                if (!value.pickup_point || !value.dropoff_point) {
                    ticket_type = await connection.query(`SELECT ticket_type.*, start_city.city_name AS start_city_name, end_city.city_name AS end_city_name FROM ticket_type LEFT JOIN city AS start_city ON start_city.city_id = ticket_type.startPointCityId LEFT JOIN city AS end_city ON end_city.city_id = ticket_type.endPointCityId WHERE routeRouteId = ${val.route_id} ORDER BY startPointCityId, endPointCityId ASC;`);
                } else {
                    ticket_type = await connection.query(`SELECT ticket_type.*, start_city.city_name AS start_city_name, end_city.city_name AS end_city_name FROM ticket_type LEFT JOIN city AS start_city ON start_city.city_id = ticket_type.startPointCityId LEFT JOIN city AS end_city ON end_city.city_id = ticket_type.endPointCityId WHERE routeRouteId = ${val.route_id} AND ticket_type.startPointCityId = ${value.pickup_point} AND ticket_type.endPointCityId = ${value.dropoff_point} ORDER BY startPointCityId, endPointCityId ASC;`);
                }

                const ticket_type_column = await connection.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ticket_type' AND COLUMN_NAME != 'ticket_type_id' AND COLUMN_NAME != 'is_active' AND COLUMN_NAME != 'is_deleted' AND COLUMN_NAME != 'created_at' AND COLUMN_NAME != 'updated_at' AND COLUMN_NAME != 'routeRouteId' AND COLUMN_NAME != 'startPointCityId' AND COLUMN_NAME != 'endPointCityId'`);

                return { ...val, ticket_type, ticket_type_column }
            })
        );

        return handleSuccess(res, 200, "Ticket types retrieved successfully", newTicketTypes);
    } catch (error: any) {
        console.log(error);
        return handleError(res, 500, 'Internal Server Error');
    }
};