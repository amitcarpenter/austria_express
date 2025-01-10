import Joi from "joi";
import { Request, Response } from "express";
import { getRepository, ILike, Like } from "typeorm";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { Tbl_City } from "../../entities/City";
import { Tbl_Terminal } from "../../entities/Terminal";

export const searchCities = async (req: Request, res: Response) => {
    try {
        const searchCitySchema = Joi.object({
            city_name: Joi.string().required()
        });

        const { error, value } = searchCitySchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { city_name } = value;

        const cityRepository = getRepository(Tbl_City);
        const terminalRepository = getRepository(Tbl_Terminal);

        const cityResult = await cityRepository.find({ where: { city_name: ILike(`${city_name}%`) } });

        if (!cityResult) return handleError(res, 404, 'No cities found');

        // const updatedCityResult = await Promise.all(
            cityResult.map(async (item) => {
                const terminalResult = await terminalRepository.find({ where: { city_id: item.city_id } });
                return { ...item, terminalResult };
            })
        // );

        return handleSuccess(res, 200, 'Cities found successfully', cityResult);
    } catch (error: any) {
        console.error("Error in getAllCity:", error);   
        return handleError(res, 500, error.message);
    }
};

export const searchCitiesByCountry = async (req: Request, res: Response) => {
    try {
        const findCityByCountryNameSchema = Joi.object({
            country_name: Joi.string().required(),
            city_name: Joi.string().required()
        });

        const { error, value } = findCityByCountryNameSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { country_name, city_name } = value;

        const cityRepository = getRepository(Tbl_City);

        const cityResult = await cityRepository.find({ where: { country_name: country_name, city_name: ILike(`${city_name}%`) } });

        if (!cityResult) return handleError(res, 404, 'Not cities found');

        return handleSuccess(res, 200, 'Cities found successfully', cityResult);
    } catch (error: any) {
        console.error("Error in getCityByCountryName:", error);
        return handleError(res, 500, error.message);
    }
};