import Joi from "joi";
import { Between, getRepository, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import moment from "moment";
import { Request, Response } from "express";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { Booking } from "../../entities/Booking";
import { BookingPassenger } from "../../entities/BookingPassenger";

export const bookingReports = async (req: Request, res: Response) => {
    try {
        const bookingOverviewSchema = Joi.object({
            report_date: Joi.string().required().allow('', null)
        });

        const { error, value } = bookingOverviewSchema.validate(req.body);

        if (error) {
            return handleError(res, 400, error.details[0].message);
        }
        const { report_date } = value;

        const bookingRepository = getRepository(Booking);
        const bookingPassengerRepository = getRepository(BookingPassenger);

        const [totalBookings, confirmedBookings, pendingBookings, cancelledBookings, totalEarnings] = await Promise.all([
            bookingRepository.count({ where: { is_deleted: false } }),
            bookingRepository.count({ where: { booking_status: 'Confirmed', is_deleted: false } }),
            bookingRepository.count({ where: { booking_status: 'Pending', is_deleted: false } }),
            bookingRepository.count({ where: { booking_status: 'Cancelled', is_deleted: false } }),
            (await bookingRepository.find({ where: { is_deleted: false } })).reduce((sum, booking) => sum + (Number(booking.total) || 0), 0)
        ]);

        let bookingOverview: any = [];

        if (report_date === "day") {
            const startOfDay = moment().startOf("day").toDate();
            const endOfDay = moment().endOf("day").toDate();
            bookingOverview = await bookingRepository.count({
                where: {
                    is_deleted: false,
                    created_at: MoreThanOrEqual(startOfDay) && LessThanOrEqual(endOfDay)
                }
            });
        } else if (report_date === "week") {
            bookingOverview = await bookingRepository.find({
                where: {
                    is_deleted: false,
                    created_at: Between(moment().startOf('isoWeek').toDate(), moment().endOf('isoWeek').toDate())
                }
            });

            const weekSummary: any = {};
            bookingOverview.forEach((booking: Booking) => {
                const dayName = moment(booking.created_at).format("ddd");
                weekSummary[dayName] = (weekSummary[dayName] || 0) + 1;
            });

            bookingOverview = weekSummary;

        } else if (report_date === "year") {
            const yearlyBookings = await bookingRepository.find({
                where: {
                    is_deleted: false,
                    created_at: Between(moment().startOf('year').toDate(), moment().endOf('year').toDate())
                }
            });

            const monthSummary: any = {};
            yearlyBookings.forEach(booking => {
                const monthName = moment(booking.created_at).format("MMM");
                monthSummary[monthName] = (monthSummary[monthName] || 0) + 1;
            });

            bookingOverview = monthSummary;
        }

        const totalPassengerOnboard = await bookingRepository.find({
            where: { is_deleted: false },
            order: { created_at: 'DESC' },
            relations: ['route', 'from', 'to']
        });

        const passengerPromises = totalPassengerOnboard.map(async (val) => {
            const passengers = await bookingPassengerRepository.count({ where: { booking: { id: val.id } } });
            return { ...val, passengers };
        });

        const passengers = await Promise.all(passengerPromises);

        const data = {
            bookingReportForAHeader: { totalBookings, confirmedBookings, pendingBookings, cancelledBookings, totalEarnings },
            bookingOverview,
            booking: passengers
        }

        return handleSuccess(res, 200, "Booking Reports Data Retrieved Successfully", data);
    } catch (error: any) {
        return handleSuccess(res, 500, error.message);
    }
};