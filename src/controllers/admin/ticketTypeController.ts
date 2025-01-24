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
            if (result.length > 0) return handleError(res, 400, `Passenger type '${value.ticket_type}' already exists.`);

            await queryRunner.query(`ALTER TABLE ticket_type ADD COLUMN ${value.ticket_type} DECIMAL(10, 2) DEFAULT NULL`);
            return handleSuccess(res, 200, `Passenger type '${value.ticket_type}' added successfully to 'ticket_type'.`);
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

            if (result.length === 0) return handleError(res, 400, `Passenger type '${ticket_type}' does not exist.`);

            await queryRunner.query(`ALTER TABLE ticket_type DROP COLUMN ??`, [ticket_type]);

            return handleSuccess(res, 200, `Passenger type '${ticket_type}' deleted successfully.`);
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

export const update_ticket_price = async (req: Request, res: Response) => {
    try {
        const ticketTypeSchema = Joi.object({
            ticket_type_id: Joi.number().required(),
            ticket_type: Joi.string().required(),
            ticket_price: Joi.number().required(),
        });

        const { error, value } = ticketTypeSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { ticket_type_id, ticket_type, ticket_price } = value;

        const connection = await getConnection();
        const queryRunner = connection.createQueryRunner();

        try {
            await queryRunner.connect();
            const query = `UPDATE ticket_type SET ${ticket_type} = ${ticket_price} WHERE ticket_type_id = ${ticket_type_id}`;
            await queryRunner.query(query);
            return handleSuccess(res, 200, `Passenger price updated successfully.`);
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