import Joi, { not } from "joi";
import { Request, Response } from "express";
import { Between, getRepository, Like, Not, Or } from "typeorm";
import { Booking } from "../../entities/Booking";
import { BookingPassenger } from "../../entities/BookingPassenger";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";

export const create_booking = async (req: Request, res: Response) => {
    try {
        const bookingSchema = Joi.object({
            route: Joi.string().required(),
            from: Joi.string().required(),
            to: Joi.string().required(),
            travel_date: Joi.string().isoDate().required(),
            departure_time: Joi.string().required(),
            arrival_time: Joi.string().required(),
            payment_method: Joi.string().required(),
            subtotal: Joi.number().precision(2).required(),
            tax: Joi.number().precision(2).required(),
            total: Joi.number().precision(2).required(),
            deposit: Joi.number().precision(2).required(),
            ticket_details: Joi.string().required(),
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
            email: Joi.string().email().required(),
            notes: Joi.string().optional().allow(null, ''),
        });

        const { error, value } = bookingSchema.validate(req.body);
        if (error) return handleError(res, 400, error.details[0].message);

        const bookingRepository = getRepository(Booking);
        const bookingPassengerRepository = getRepository(BookingPassenger);

        const { route, from, to, travel_date, departure_time, arrival_time, payment_method, subtotal, tax, total, deposit, ticket_details, first_name, last_name, phone, email, notes } = value;

        const newBooking = bookingRepository.create({
            route: route,
            from: from,
            to: to,
            travel_date: travel_date,
            departure_time: departure_time,
            arrival_time: arrival_time,
            payment_method: payment_method,
            subtotal: subtotal,
            tax: tax,
            total: total,
            deposit: deposit,
            first_name: first_name,
            last_name: last_name,
            phone: phone,
            email: email,
            notes: notes
        });
        await bookingRepository.save(newBooking);

        JSON.parse(ticket_details).map(async (passenger: any) => {
            const newPassenger = bookingPassengerRepository.create({
                booking: newBooking,
                ticket_type: passenger.ticketType,
                selected_seat: passenger.selectedSeat,
                passenger_name: passenger.passengerName,
                price: passenger.price
            })
            await bookingPassengerRepository.save(newPassenger);
        })

        return handleSuccess(res, 201, 'Successfully booking add')
    } catch (error: any) {
        console.error("Error in create booking:", error);
        return handleError(res, 500, error.message);
    }
};

export const get_all_booking = async (req: Request, res: Response) => {
    try {
        const bookingSchema = Joi.object({
            booking_status: Joi.string().valid('Pending', 'Confirmed', 'Cancelled', '').optional(),
            search: Joi.string().optional().allow(""),
            start_date: Joi.string().optional(),
            end_date: Joi.string().optional(),
            route_id: Joi.string().optional()
        });

        const { error, value } = bookingSchema.validate(req.body);
        if (error) return handleError(res, 400, error.details[0].message);

        const bookingRepository = getRepository(Booking);
        const bookingPassengerRepository = getRepository(BookingPassenger);
        const { booking_status, search, start_date, end_date, route_id } = value;

        const whereCondition: any = { is_deleted: false };

        if (booking_status) whereCondition.booking_status = booking_status;

        let searchCondition: any = [];

        if (search) {
            searchCondition = [
                { first_name: Like(`%${search}%`), is_deleted: false },
                { last_name: Like(`%${search}%`), is_deleted: false },
                { email: Like(`%${search}%`), is_deleted: false }
            ];
        }

        if (start_date && end_date) {
            whereCondition.travel_date = Between(start_date, end_date);
        }

        if (route_id) {
            whereCondition.route = { route_id: route_id };
        }

        const getAllBooking = await bookingRepository.find({
            where: search ? [{ ...whereCondition, ...searchCondition[0] }, { ...whereCondition, ...searchCondition[1] }, { ...whereCondition, ...searchCondition[2] }] : whereCondition,
            relations: ['from', 'to'],
            order: { booking_id: 'DESC' }
        });

        const bookingPassengers = await Promise.all(
            getAllBooking.map(async (product) => {
                const passengers = await bookingPassengerRepository.find({
                    where: { booking: { booking_id: product.booking_id } }
                });
                return { ...product, passengers };
            })
        );

        return handleSuccess(res, 200, "Get All Booking", bookingPassengers);
    } catch (error: any) {
        console.error("Error in create booking:", error);
        return handleError(res, 500, error.message);
    }
};

export const get_booking_by_id = async (req: Request, res: Response) => {
    try {
        const bookingSchema = Joi.object({
            booking_id: Joi.string().required(),
        });

        const { error, value } = bookingSchema.validate(req.query);
        if (error) return handleError(res, 400, error.details[0].message);

        const bookingRepository = getRepository(Booking);
        const bookingPassengerRepository = getRepository(BookingPassenger);

        const { booking_id } = value;

        const getAllBooking = await bookingRepository.findOne({ where: { booking_id }, relations: ['from', 'to', 'route'] });

        if (!getAllBooking) return handleError(res, 404, "Booking not found");

        const passengers = await bookingPassengerRepository.find({
            where: { booking: { booking_id: getAllBooking?.booking_id } }
        });

        return handleSuccess(res, 200, "Get Booking By Id", { ...getAllBooking, passengers });
    } catch (error: any) {
        console.error("Error in get booking by id:", error);
        return handleError(res, 500, error.message);
    }
};

export const update_booking_by_id = async (req: Request, res: Response) => {
    try {
        const bookingSchema = Joi.object({
            booking_id: Joi.string().required(),
            payment_method: Joi.string().required(),
            subtotal: Joi.number().precision(2).required(),
            tax: Joi.number().precision(2).required(),
            total: Joi.number().precision(2).required(),
            deposit: Joi.number().precision(2).required(),
            ticket_details: Joi.string().required(),
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
            email: Joi.string().email().required(),
            notes: Joi.string().optional().allow(null, ''),
        });

        const { error, value } = bookingSchema.validate(req.body);
        if (error) return handleError(res, 400, error.details[0].message);

        const bookingRepository = getRepository(Booking);
        const bookingPassengerRepository = getRepository(BookingPassenger);

        const { booking_id, payment_method, subtotal, tax, total, deposit, ticket_details, first_name, last_name, phone, email, notes } = value;

        const findBooking = await bookingRepository.findOne({ where: { booking_id } });
        if (!findBooking) return handleError(res, 404, "Booking not found");

        Object.assign(findBooking, {
            payment_method, subtotal, tax, total, deposit,
            first_name, last_name, phone, email, notes
        });

        await bookingRepository.save(findBooking);

        await bookingPassengerRepository.delete({ booking: { booking_id } })

        await Promise.all(JSON.parse(ticket_details).map(async (passenger: any) => {
            const newPassenger = bookingPassengerRepository.create({
                booking: findBooking,
                ticket_type: passenger.ticketType,
                selected_seat: passenger.selectedSeat,
                passenger_name: passenger.passengerName,
                price: passenger.price
            })
            await bookingPassengerRepository.save(newPassenger);
        }))

        return handleSuccess(res, 200, 'Booking successfully updated');
    } catch (error: any) {
        console.error("Error in update booking by id:", error);
        return handleError(res, 500, error.message);
    }
};

export const delete_booking_by_id = async (req: Request, res: Response) => {
    try {
        const bookingSchema = Joi.object({
            booking_id: Joi.string().required()
        });

        const { error, value } = bookingSchema.validate(req.query);
        if (error) return handleError(res, 400, error.details[0].message);

        const bookingRepository = getRepository(Booking);
        const { booking_id } = value;

        const findBooking = await bookingRepository.findOne({ where: { booking_id, is_deleted: false } });
        if (!findBooking) return handleError(res, 404, "Booking not found or already deleted");

        await bookingRepository.update({ booking_id }, { is_deleted: true });

        return handleSuccess(res, 200, 'Booking successfully deleted');
    } catch (error: any) {
        console.error("Error in delete booking by id:", error);
        return handleError(res, 500, error.message);
    }
};