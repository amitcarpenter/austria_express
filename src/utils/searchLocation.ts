import Joi from "joi";
import axios from "axios"
import { Request, Response } from "express";
import { handleSuccess, handleError, joiErrorHandle } from "./responseHandler";

export const get_location = async (req: Request, res: Response) => {
    try {
        const findLatlongSchema = Joi.object({
            location: Joi.string().required()
        });

        const { error, value } = findLatlongSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { location } = value;
        const googleApiKey = process.env.GOOGLE_DISTANCE_API_KEY

        if (!googleApiKey) return handleError(res, 500, 'Google API key is not set');

        const response = await axios({
            method: 'get',
            url: `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${googleApiKey}&input=${location}`,
        });

        return handleSuccess(res, 200, 'Location data fetched successfully', response.data.predictions);
    } catch (error: any) {
        return handleError(res, 500, error.message)
    }
};