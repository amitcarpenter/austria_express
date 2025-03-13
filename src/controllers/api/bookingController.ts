import Joi, { not } from "joi";
import path from "path";
import ejs, { name } from 'ejs';
import { Request, Response } from "express";
import { Between, getRepository, Like, Not, Or } from "typeorm";
import { Booking } from "../../entities/Booking";
import { BookingPassenger } from "../../entities/BookingPassenger";
import { handleSuccess, handleError } from "../../utils/responseHandler";
import { IUser } from "../../models/User";
import { sendEmail } from "../../services/otpService";
import { generateBookingNumber } from "../../utils/function";
import moment from "moment";

export const create_booking = async (req: Request, res: Response) => {
    try {
        const bookingSchema = Joi.object({
            route: Joi.string().required(),
            route_name: Joi.string().required(),
            from: Joi.string().required(),
            from_city: Joi.string().required(),
            to: Joi.string().required(),
            to_city: Joi.string().required(),
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

        const { route, route_name, from, from_city, to, to_city, travel_date, departure_time, arrival_time, payment_method, subtotal, tax, total, deposit, ticket_details, first_name, last_name, phone, email, notes } = value;
        const user_req = req.user as IUser;

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
            booking_user_id: user_req.id
        });
        await bookingRepository.save(newBooking);

        JSON.parse(ticket_details).map(async (passenger: any) => {
            const newPassenger = bookingPassengerRepository.create({
                booking: newBooking,
                ticket_type: passenger.ticketType,
                selected_seat: passenger.selectedSeat == '' ? null : passenger.selectedSeat,
                passenger_name: passenger.passengerName,
                price: passenger.price
            })
            await bookingPassengerRepository.save(newPassenger);
        })

        const emailTemplatePath = path.resolve(__dirname, '../../views/booking.ejs');
        const emailHtml = await ejs.renderFile(emailTemplatePath, { first_name, last_name, email, phone, total, travel_date, departure_time, arrival_time, payment_method, route_name, from_city, to_city });

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