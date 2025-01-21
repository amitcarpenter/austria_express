import { Request, Response } from "express";
import Joi from "joi";
import { getRepository, Like, Not } from "typeorm";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { TicketType } from "../../entities/TicketType";

export const add_ticket_type = async (req: Request, res: Response) => {
    try {
        const ticketTypeSchema = Joi.object({
            ticket_type: Joi.string().required(),
        });

        const { error, value } = ticketTypeSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const ticketTypeRepository = getRepository(TicketType);

        const { ticket_type } = value;

        const existingTicketType = await ticketTypeRepository.findOne({ where: { ticket_type } });
        if (existingTicketType) return handleError(res, 409, "Ticket type already exists");

        const newTicketType = await ticketTypeRepository.create({
            ticket_type: ticket_type
        });
        await ticketTypeRepository.save(newTicketType);

        return handleSuccess(res, 201, "Ticket type added successfully");
    } catch (error: any) {
        console.log(error);
        return handleError(res, 500, error.message);
    }
};

export const update_ticket_type = async (req: Request, res: Response) => {
    try {
        const ticketTypeSchema = Joi.object({
            ticket_type_id: Joi.number().required(),
            ticket_type: Joi.string().required(),
        });

        const { error, value } = ticketTypeSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const ticketTypeRepository = getRepository(TicketType);
        const { ticket_type_id, ticket_type } = value;

        const findTicket = await ticketTypeRepository.findOne({ where: { ticket_type_id: ticket_type_id } });
        if (!findTicket) return handleError(res, 404, 'Ticket type not found');

        const duplicateTicketType = await ticketTypeRepository.findOne({
            where: { ticket_type, ticket_type_id: Not(ticket_type_id) }
        });
        if (duplicateTicketType) return handleError(res, 400, 'Ticket type already exists');

        if (ticket_type) findTicket.ticket_type = ticket_type;

        await ticketTypeRepository.save(findTicket);

        return handleSuccess(res, 200, "Ticket type updated successfully");
    } catch (error: any) {
        console.log(error);
        return handleError(res, 500, 'Internal Server Error');
    }
};

export const delete_ticket_type = async (req: Request, res: Response) => {
    try {
        const ticketTypeSchema = Joi.object({
            ticket_type_id: Joi.number().required(),
        });

        const { error, value } = ticketTypeSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const ticketTypeRepository = getRepository(TicketType);
        const { ticket_type_id } = value;

        const findTicket = await ticketTypeRepository.findOne({ where: { ticket_type_id: ticket_type_id } });
        if (!findTicket) return handleError(res, 404, 'Ticket type not found or already deleted');

        await ticketTypeRepository.delete({ ticket_type_id: ticket_type_id });

        return handleSuccess(res, 200, "Ticket type deleted successfully");
    } catch (error: any) {
        console.log(error);
        return handleError(res, 500, 'Internal Server Error');
    }
};

export const get_all_ticket_type = async (req: Request, res: Response) => {
    try {
        const ticketTypeRepository = getRepository(TicketType);

        const findTicketTypes = await ticketTypeRepository.find();

        return handleSuccess(res, 200, "Ticket types retrieved successfully", findTicketTypes);
    } catch (error: any) {
        console.log(error);
        return handleError(res, 500, 'Internal Server Error');
    }
};

export const get_all_ticket_type_search_limit = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        const pageNumber = parseInt(page as string, 10);
        const pageLimit = parseInt(limit as string, 10);

        const offset = (pageNumber - 1) * pageLimit;

        const ticketTypeRepository = getRepository(TicketType);

        const [ticketTypes, total] = await ticketTypeRepository.findAndCount({
            where: search ? [
                { ticket_type: Like(`%${search}%`) }
            ] : [],
            take: pageLimit,
            skip: offset,
        });

        const totalPages = Math.ceil(total / pageLimit);

        return handleSuccess(res, 200, "Ticket types retrieved successfully.", {
            ticketTypes,
            pagination: {
                total,
                totalPages,
                currentPage: pageNumber,
                pageSize: pageLimit,
            },
        });
    } catch (error: any) {
        console.log(error);
        return handleError(res, 500, 'Internal Server Error');
    }
};