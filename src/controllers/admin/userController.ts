import Joi from "joi";
import ejs from 'ejs';
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { IAdmin } from "../../models/Admin";
import { User } from "../../entities/User";
import { Admin } from "../../entities/Admin";
import { getRepository, MoreThan } from "typeorm";
import { sendEmail } from "../../services/otpService";
import { handleError, handleSuccess, joiErrorHandle } from "../../utils/responseHandler";
import { crudHandler } from "../../utils/crudHandler";


dotenv.config();

const APP_URL = process.env.APP_URL as string;
const image_logo = process.env.LOGO_URL as string;


export const get_all_user_list = async (req: Request, res: Response) => {
    try {
        const userRepository = getRepository(User)
        const user_list = await userRepository.find({ order: { created_at: "DESC" } })
        if (!user_list) {
            return handleError(res, 404, "Users Not Found")
        }
        user_list.map((user) => {
            if (user.profile_image) {
                user.profile_image = APP_URL + user.profile_image
            }
        })
        return handleSuccess(res, 200, `Users Fetched Successfully.`, user_list);
    } catch (error: any) {
        console.error('Error in register:', error);
        return handleError(res, 500, error.message);
    }
};


export const change_user_status = async (req: Request, res: Response) => {
    try {
        let response_message = null;
        const changeStatusSchema = Joi.object({
            user_id: Joi.number().required(),
            is_active: Joi.boolean().required()
        })
        const { error, value } = changeStatusSchema.validate(req.body)
        if (error) return joiErrorHandle(res, error);
        const { user_id, is_active } = value
        const userRepository = getRepository(User)
        const user = await userRepository.findOneBy({ id: user_id })
        if (!user) {
            return handleError(res, 404, "User Not Found")
        }
        user.is_active = is_active
        if (!is_active) {
            response_message = "User Deactivated Successfully";
        } else {
            response_message = "User Activated Successfully";
        }

        await userRepository.save(user)
        return handleSuccess(res, 200, response_message);
    } catch (error: any) {
        console.error('Error in register:', error);
        return handleError(res, 500, error.message);
    }
};


//================================== Crud Handler ======================

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await crudHandler({
            model: User,
            action: "read",
            order: { created_at: "DESC" },
        });
        if (Array.isArray(result)) {
            if (result.length === 0) {
                return handleError(res, 404, "No users found");
            }
            return handleSuccess(res, 200, "Users fetched successfully", result);
        }
        return handleError(res, 500, "Unknown error occurred");
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};