import Joi from "joi";
import { Between, getRepository, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import moment from "moment";
import { Request, Response } from "express";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { Booking } from "../../entities/Booking";
import { BookingPassenger } from "../../entities/BookingPassenger";
import { TicketType } from "../../entities/TicketType";


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
        const TicketTypeRepository = getRepository(TicketType);

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

        const ticketCounts = await bookingPassengerRepository
            .createQueryBuilder("bp")
            .select("bp.ticket_type", "ticket_type")
            .addSelect("COUNT(*)", "count")
            .groupBy("bp.ticket_type")
            .getRawMany();



        const data = {
            bookingReportForAHeader: { totalBookings, confirmedBookings, pendingBookings, cancelledBookings, totalEarnings },
            bookingOverview,
            booking: passengers,
            ticketCounts
        }

        return handleSuccess(res, 200, "Booking Reports Data Retrieved Successfully", data);
    } catch (error: any) {
        return handleSuccess(res, 500, error.message);
    }
};


export const earningReports = async (req: Request, res: Response) => {
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

        let earningOverview: any = [];

        if (report_date === "day") {
            const startOfDay = moment().startOf("day").toDate();
            const endOfDay = moment().endOf("day").toDate();

            earningOverview = await bookingRepository
                .createQueryBuilder("booking")
                .select("SUM(booking.total)", "total_earning")
                .where("booking.is_deleted = :isDeleted", { isDeleted: false })
                .andWhere("booking.created_at BETWEEN :start AND :end", { start: startOfDay, end: endOfDay })
                .getRawOne();
        }

        else if (report_date === "week") {
            const weeklyBookings = await bookingRepository.find({
                where: {
                    is_deleted: false,
                    created_at: Between(moment().startOf('isoWeek').toDate(), moment().endOf('isoWeek').toDate())
                }
            });

            const weekSummary: any = {};
            weeklyBookings.forEach((booking) => {
                const dayName = moment(booking.created_at).format("ddd");
                weekSummary[dayName] = (weekSummary[dayName] || 0) + Number(booking.total);
            });

            earningOverview = weekSummary;
        }

        else if (report_date === "year") {
            const yearlyBookings = await bookingRepository.find({
                where: {
                    is_deleted: false,
                    created_at: Between(moment().startOf('year').toDate(), moment().endOf('year').toDate())
                }
            });

            const monthSummary: any = {};
            yearlyBookings.forEach(booking => {
                const monthName = moment(booking.created_at).format("MMM");
                monthSummary[monthName] = (monthSummary[monthName] || 0) + Number(booking.total);
            });
            earningOverview = monthSummary;
        }


        const ticketRevenues = await bookingPassengerRepository
        .createQueryBuilder("bp")
        .select("bp.ticket_type", "ticket_type")
        .addSelect("SUM(bp.price)", "total_revenue") // ✅ Summing up bp.price instead of b.total
        .groupBy("bp.ticket_type")
        .getRawMany();
    

        const data = {
            bookingReportForAHeader: { totalBookings, confirmedBookings, pendingBookings, cancelledBookings, totalEarnings },
            earningOverview,
            ticketRevenues
        }

        return handleSuccess(res, 200, "Booking Reports Data Retrieved Successfully", data);
    } catch (error: any) {
        return handleSuccess(res, 500, error.message);
    }
};