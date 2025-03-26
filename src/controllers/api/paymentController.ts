import Joi from "joi";
import axios from "axios";
import crypto from "crypto";
// import LiqPay from 'liqpay-sdk';
import { Request, Response } from "express";
import { IUser } from "../../models/User";
import { getRepository } from "typeorm";
import { User } from "../../entities/User";
import { handleError } from "../../utils/responseHandler";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const stripe = new Stripe(STRIPE_SECRET_KEY);

export const createStripeCheckoutSession = async (req: Request, res: Response) => {
    const bookingSchema = Joi.object({
        booking_id: Joi.string().required(),
        amount: Joi.string().required(),
        currency: Joi.string().required()
    });

    const { error, value } = bookingSchema.validate(req.body);
    if (error) return handleError(res, 400, error.details[0].message);

    const user_req = req.user as IUser;
    const { booking_id, amount, currency } = value;
    try {
        const userRepository = getRepository(User);
        const user = await userRepository.findOneBy({ id: user_req.id });

        if (!user) {
            return handleError(res, 404, "User Not Found")
        }

        let customerId = user?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user?.email,
                name: `${user.first_name} ${user.last_name}`
            });
            user.stripe_customer_id = customer.id;
            await userRepository.save(user);
            customerId = customer.id;
        }

        const amountInCents = Math.round(amount * 100);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: 'payment',
            customer: customerId,
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: { name: "Bus Ticket Payment" },
                        unit_amount: amountInCents
                    },
                    quantity: 1
                }
            ],
            success_url: `${process.env.APP_URL}/amount_add_successfull?session_id={CHECKOUT_SESSION_ID}&user_id=${user_req.id}&amount=${amount}&totalAmount=${amount}&booking_id=${booking_id}`,
            cancel_url: `${process.env.APP_URL}/amount_add_cancelled?session_id={CHECKOUT_SESSION_ID}`,
            saved_payment_method_options: {
                payment_method_save: 'enabled',
            },
        });

       return res.json({ url: session.url });

    } catch (error) {
        return res.status(500).json({ error: true, message: `Internal server error + ' ' + ${error}`, status: 500, success: false });
    }
};

export const createLiqpayCheckoutSession = async (req: Request, res: Response) => {
    const LIQPAY_PUBLIC_KEY = process.env.LIQPAY_PUBLIC_KEY as string;
    const LIQPAY_SECRET_KEY = process.env.LIQPAY_SECRET_KEY as string;
    try {
        const paymentData = {
            version: "3",
            public_key: LIQPAY_PUBLIC_KEY,
            action: "pay",
            amount: "100",
            currency: "EUR",
            description: "Test Payment",
            order_id: "order123456",
            result_url: `${process.env.APP_URL}/amount_add_successfull`,
            server_url: `${process.env.APP_URL}/amount_add_cancelled`,
            paytypes: "card",
        };
        const dataString = Buffer.from(JSON.stringify(paymentData)).toString("base64");

        const signature = crypto.createHash("sha1")
            .update(LIQPAY_SECRET_KEY + dataString + LIQPAY_SECRET_KEY)
            .digest("base64");

        const paymentUrl = `https://www.liqpay.ua/api/3/checkout?data=${encodeURIComponent(dataString)}&signature=${encodeURIComponent(signature)}`;

        res.json({ success: true, url: paymentUrl });
        // const form = liqpay.cnb_form(paymentData);

        // res.json({ success: true, form });
    } catch (error) {
        return res.status(500).json({ error: true, message: `Internal server error + ' ' + ${error}`, status: 500, success: false });
    }
};