import Joi from "joi";
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { Tbl_City } from "../../entities/City";

export const createCity = async (req: Request, res: Response) => {
    try {
        const createCitySchema = Joi.object({
            country_name: Joi.string().required(),
            city_name: Joi.string().required()
        });

        const { error, value } = createCitySchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { country_name, city_name } = value;

        const cityRepository = getRepository(Tbl_City);

        const cityResult = await cityRepository.findOne({ where: { city_name: city_name } });

        if (cityResult) return handleError(res, 200, 'City name already exists');

        const newCity = cityRepository.create({
            country_name,
            city_name
        });

        await cityRepository.save(newCity);

        return handleSuccess(res, 200, "City Created Successfully.");
    } catch (error: any) {
        console.error("Error in create_bus:", error);
        return handleError(res, 500, error.message);
    }
};

export const getAllCity = async (req: Request, res: Response) => {
    try {
        const cityRepository = getRepository(Tbl_City);

        const cityResult = await cityRepository.find();

        if (!cityResult) return handleError(res, 404, 'No cities found');

        return handleSuccess(res, 200, 'Cities found successfully', cityResult);
    } catch (error: any) {
        console.error("Error in getAllCity:", error);
        return handleError(res, 500, error.message);
    }
};

export const updateCity = async (req: Request, res: Response) => {
    try {
        const updateCitySchema = Joi.object({
            city_id: Joi.number().required(),
            country_name: Joi.string().required(),
            city_name: Joi.string().required()
        });

        const { error, value } = updateCitySchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { city_id, country_name, city_name } = value;

        const cityRepository = getRepository(Tbl_City);

        const cityResult = await cityRepository.findOne({ where: { city_id: city_id } });

        if (!cityResult) return handleError(res, 404, 'City not found');

        const existingCity = await cityRepository.find({ where: { city_name: city_name } });

        if (existingCity && (existingCity.length > 1 || existingCity.length == 1 && existingCity[0].city_id != city_id)) return handleError(res, 400, 'City name already exists');

        // Proceed with the update
        cityResult.country_name = country_name;
        cityResult.city_name = city_name;

        await cityRepository.save(cityResult);

        return handleSuccess(res, 200, 'City updated successfully');
    } catch (error: any) {
        console.error("Error in updateCity:", error);
        return handleError(res, 500, error.message);
    }
};

export const deleteCityById = async (req: Request, res: Response) => {
    try {
        const deleteCitySchema = Joi.object({
            city_id: Joi.number().required()
        });

        const { error, value } = deleteCitySchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { city_id } = value;

        const cityRepository = getRepository(Tbl_City);

        const cityResult = await cityRepository.findOne({ where: { city_id: city_id } });

        if (!cityResult) return handleError(res, 404, 'City not found or already deleted');

        const cityDeleteResult = await cityRepository.delete(city_id)

        return handleSuccess(res, 200, 'City deleted successfully');
    } catch (error: any) {
        console.error("Error in getAllCity:", error);
        return handleError(res, 500, error.message);
    }
};

export const getCityByCountryName = async (req: Request, res: Response) => {
    try {
        const findCityByCountryNameSchema = Joi.object({
            country_name: Joi.string().required()
        });

        const { error, value } = findCityByCountryNameSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { country_name } = value;

        const cityRepository = getRepository(Tbl_City);

        const cityResult = await cityRepository.find({ where: { country_name: country_name } });

        if (!cityResult) return handleError(res, 404, 'Not cities found');

        return handleSuccess(res, 200, 'Cities found successfully', cityResult);
    } catch (error: any) {
        console.error("Error in getCityByCountryName:", error);
        return handleError(res, 500, error.message);
    }
};