import { Request, Response } from "express";
import Joi from "joi";
import { getRepository } from "typeorm";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { Route } from "../../entities/Route";
import { getConnection } from 'typeorm';

export const add_ticket_type = async (req: Request, res: Response) => {
    try {
        const ticketTypeSchema = Joi.object({
            ticket_type: Joi.string().required(),
        });

        const { error, value } = ticketTypeSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const connection = await getConnection();
        const queryRunner = connection.createQueryRunner();

        try {
            await queryRunner.connect();
            const result = await queryRunner.query(`SHOW COLUMNS FROM ticket_type LIKE '${value.ticket_type}'`);
            if (result.length > 0) return handleError(res, 400, `Ticket type '${value.ticket_type}' already exists.`);

            await queryRunner.query(`ALTER TABLE ticket_type ADD COLUMN  \`${value.ticket_type}\` DECIMAL(10, 2) DEFAULT NULL`);
            return handleSuccess(res, 200, `Ticket type '${value.ticket_type}' added successfully.`);
        } catch (error) {
            console.error('Error adding column:', error);
            return handleError(res, 500, 'An error occurred while adding the column.');
        } finally {
            await queryRunner.release();
        }
    } catch (error: any) {
        console.log(error);
        return handleError(res, 500, error.message);
    }
};

export const delete_ticket_type = async (req: Request, res: Response) => {
    try {
        const ticketTypeSchema = Joi.object({
            ticket_type: Joi.string().required(),
        });

        const { error, value } = ticketTypeSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { ticket_type } = value;

        const connection = await getConnection();
        const queryRunner = connection.createQueryRunner();

        try {
            await queryRunner.connect();

            const result = await queryRunner.query(`SHOW COLUMNS FROM ticket_type LIKE ?`, [ticket_type]);

            if (result.length === 0) return handleError(res, 400, `Ticket type '${ticket_type}' does not exist.`);

            await queryRunner.query(`ALTER TABLE ticket_type DROP COLUMN ??`, [ticket_type]);

            return handleSuccess(res, 200, `Ticket type '${ticket_type}' deleted successfully.`);
        } catch (error) {
            console.error('Error deleting column:', error);
            return handleError(res, 500, 'An error occurred while deleting the column.');
        } finally {
            await queryRunner.release();
        }
    } catch (error: any) {
        console.log(error);
        return handleError(res, 500, error.message);
    }
};

export const get_all_ticket_type = async (req: Request, res: Response) => {
    try {
        const connection = await getConnection();
        const routeRepository = getRepository(Route);

        const findRoutes = await routeRepository.find({ where: { is_deleted: false }, relations: ['pickup_point', 'dropoff_point'], order: { route_id: 'DESC' }, });

        const newTicketTypes = await Promise.all(
            findRoutes.map(async (val) => {
                let ticket_type = await connection.query(`SELECT * FROM ticket_type WHERE routeRouteId = ${val.route_id}`);
                return { ...val, ticket_type }
            })
        );

        return handleSuccess(res, 200, "Ticket types retrieved successfully", newTicketTypes);
    } catch (error: any) {
        console.log(error);
        return handleError(res, 500, 'Internal Server Error');
    }
};

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

export const update_ticket_price = async (req: Request, res: Response) => {
    try {
        const connection = await getConnection();
        const queryRunner = connection.createQueryRunner();

        try {
            await queryRunner.connect();
            for (const ticket of req.body) {
                const updates: string[] = [];
                const { ticket_type_id, is_active, ...columns } = ticket;

                updates.push(`is_active = ${is_active}`);

                for (const [key, val] of Object.entries(columns)) {
                    if (val !== undefined) {
                        const valueToSet = val === null ? 'NULL' : `${val}`;
                        updates.push(`${key} = ${valueToSet}`);
                    }
                }

                const updateQuery = `
                    UPDATE ticket_type
                    SET ${updates.join(', ')}
                    WHERE ticket_type_id = ${ticket_type_id}
                `;

                await queryRunner.query(updateQuery);
            }

            return handleSuccess(res, 200, `Ticket prices and statuses updated successfully.`);
        } catch (error) {
            console.error('Error adding column:', error);
            return handleError(res, 500, 'An error occurred while adding the column.');
        } finally {
            await queryRunner.release();
        }
    } catch (error: any) {
        console.log(error);
        return handleError(res, 500, 'Internal Server Error');
    }
};