import Joi, { not } from "joi";
import path from "path";
import ejs, { name } from 'ejs';
import { Request, Response } from "express";
import { Between, getRepository, Like, Not, Or } from "typeorm";
import { Booking } from "../../entities/Booking";
import { BookingPassenger } from "../../entities/BookingPassenger";
import { handleSuccess, handleError } from "../../utils/responseHandler";
import { IAdmin } from "../../models/Admin";
import { sendEmail } from "../../services/otpService";
import { generateBookingNumber } from "../../utils/function";
import moment from "moment";

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
            phone: Joi.string().required(),
            email: Joi.string().email().required(),
            notes: Joi.string().optional().allow(null, ''),
        });

        const { error, value } = bookingSchema.validate(req.body);
        if (error) return handleError(res, 400, error.details[0].message);

        const bookingRepository = getRepository(Booking);
        const bookingPassengerRepository = getRepository(BookingPassenger);

        const { route, from, to, travel_date, departure_time, arrival_time, payment_method, subtotal, tax, total, deposit, ticket_details, first_name, last_name, phone, email, notes } = value;
        const admin_req = req.admin as IAdmin;

        const newBooking = bookingRepository.create({
            booking_number: await generateBookingNumber(),
            route: route,
            from: from,
            to: to,
            travel_date: moment(travel_date).format("YYYY-MM-DD"),
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
            notes: notes,
            booking_user_id: admin_req.id
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

        const findBooking = await bookingRepository.findOne({ where: { id: newBooking.id }, relations: ['from', 'to', 'route'] });

        const emailTemplatePath = path.resolve(__dirname, '../../views/booking.ejs');
        const emailHtml = await ejs.renderFile(emailTemplatePath, { first_name, last_name, email, phone, total, travel_date, departure_time, arrival_time, payment_method, route_name: findBooking?.route.title, from_city: findBooking?.from.city_name, to_city: findBooking?.to.city_name });

        const emailOptions = {
            to: email,
            subject: "Your Ticket Has Been Successfully Booked",
            html: emailHtml
        };
        await sendEmail(emailOptions);

        return handleSuccess(res, 201, 'Your ticket has been booked successfully', newBooking)
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
            order: { booking_number: 'DESC' }
        });

        const bookingPassengers = await Promise.all(
            getAllBooking.map(async (product) => {
                const passengers = await bookingPassengerRepository.find({
                    where: { booking: { booking_number: product.booking_number } }
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

        const getAllBooking = await bookingRepository.findOne({ where: { id: booking_id }, relations: ['from', 'to', 'route'] });

        if (!getAllBooking) return handleError(res, 404, "Booking not found");

        const passengers = await bookingPassengerRepository.find({
            where: { booking: { id: getAllBooking?.id } }
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
            booking_status: Joi.string().valid('Pending', 'Confirmed', 'Cancelled').required(),
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

        const { booking_id, booking_status, payment_method, subtotal, tax, total, deposit, ticket_details, first_name, last_name, phone, email, notes } = value;

        const findBooking = await bookingRepository.findOne({ where: { id: booking_id }, relations: ['from', 'to', 'route'] });
        if (!findBooking) return handleError(res, 404, "Booking not found");

        Object.assign(findBooking, {
            booking_status, payment_method, subtotal, tax, total, deposit,
            first_name, last_name, phone, email, notes
        });

        await bookingRepository.save(findBooking);

        await bookingPassengerRepository.delete({ booking: { id: booking_id } })

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

        if (booking_status === 'Confirmed') {
            const emailTemplatePath = path.resolve(__dirname, '../../views/confirm_booking.ejs');
            const emailHtml = await ejs.renderFile(emailTemplatePath, {
                first_name, last_name, booking_number: findBooking.booking_number, from_city: findBooking.from.city_name,
                to_city: findBooking.to.city_name,
                route_title: findBooking.route.title,
                departure_datetime: findBooking.departure_time,
                total_amount: findBooking.total,
                passengers: JSON.parse(ticket_details)
            });

            const emailOptions = {
                to: email,
                subject: "Your Ticket Has Been Confirmed",
                html: emailHtml
            };
            await sendEmail(emailOptions);

            return handleSuccess(res, 200, 'Booking has been successfully confirmed.');
        } else if (booking_status === 'Cancelled') {
            const emailTemplatePath = path.resolve(__dirname, '../../views/cancelled_booking.ejs');
            const emailHtml = await ejs.renderFile(emailTemplatePath, {
                first_name,
                last_name,
                booking_number: findBooking.booking_number,
                from_city: findBooking.from.city_name,
                to_city: findBooking.to.city_name,
                route_title: findBooking.route.title,
                departure_datetime: findBooking.departure_time,
                total_amount: findBooking.total
            });

            const emailOptions = {
                to: email,
                subject: "Your Ticket Has Been Cancelled",
                html: emailHtml
            };
            await sendEmail(emailOptions);

            return handleSuccess(res, 200, 'Booking has been successfully cancelled.');
        } else {
            return handleSuccess(res, 200, 'Booking successfully updated');
        }
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

        const findBooking = await bookingRepository.findOne({ where: { id: booking_id, is_deleted: false } });
        if (!findBooking) return handleError(res, 404, "Booking not found or already deleted");

        await bookingRepository.update({ id: booking_id }, { is_deleted: true });

        return handleSuccess(res, 200, 'Booking successfully deleted');
    } catch (error: any) {
        console.error("Error in delete booking by id:", error);
        return handleError(res, 500, error.message);
    }
};

export const get_booking_by_route_date_and_from_to = async (req: Request, res: Response) => {
    try {
        const bookingSchema = Joi.object({
            route: Joi.string().required(),
            from: Joi.string().required(),
            to: Joi.string().required(),
            travel_date: Joi.string().isoDate().required()
        });

        const { error, value } = bookingSchema.validate(req.body);
        if (error) return handleError(res, 400, error.details[0].message);

        const bookingRepository = getRepository(Booking);
        const bookingPassengerRepository = getRepository(BookingPassenger);

        const { route, from, to, travel_date } = value;

        const getAllBooking = await bookingRepository.find({ where: { from: { city_id: from }, to: { city_id: to }, route: { route_id: route }, travel_date: travel_date, is_deleted: false }, relations: ['from', 'to', 'route'] });

        if (!getAllBooking.length) return handleError(res, 404, "Booking not found");

        const bookingPassengers = await Promise.all(
            getAllBooking.map(async (product) => {
                const passengers = await bookingPassengerRepository.find({
                    where: { booking: { id: product.id } }
                });
                return { ...product, passengers };
            })
        );

        return handleSuccess(res, 200, "Get All Booking", bookingPassengers);
    } catch (error: any) {
        console.error("Error in get booking by route date from to:", error);
        return handleError(res, 500, error.message);
    }
};

export const getTicketBookingByBookingId = async (req: Request, res: Response) => {
    try {
        const bookingSchema = Joi.object({
            id: Joi.number().required(),
        });

        const { error, value } = bookingSchema.validate(req.query);
        if (error) return handleError(res, 400, error.details[0].message);

        const bookingRepository = getRepository(Booking);
        const bookingPassengerRepository = getRepository(BookingPassenger);

        const { id } = value;

        const getAllBooking = await bookingRepository.find({ where: { id, is_deleted: false }, relations: ['from', 'to', 'route'] });

        if (!getAllBooking.length) return handleError(res, 404, "Booking not found");

        const bookingPassengers = await Promise.all(
            getAllBooking.map(async (product) => {
                const passengers = await bookingPassengerRepository.find({
                    where: { booking: { id: product.id } }
                });
                return { ...product, passengers };
            })
        );

        return handleSuccess(res, 200, "Get Ticket Booking", bookingPassengers);
    } catch (error: any) {
        console.error("Error in create booking:", error);
        return handleError(res, 500, error.message);
    }
};