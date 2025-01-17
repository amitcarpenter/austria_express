import Joi from "joi";
import { Request, Response } from "express";
import { getRepository, Like, Not } from "typeorm";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { City } from "../../entities/City";
import { Terminal } from "../../entities/Terminal";
import { get_lat_long } from "../../utils/function";

export const createCity = async (req: Request, res: Response) => {
    try {
        const createCitySchema = Joi.object({
            country_name: Joi.string().required(),
            city_name: Joi.string().required()
        });

        const { error, value } = createCitySchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { country_name, city_name } = value;

        const cityRepository = getRepository(City);

        const cityResult = await cityRepository.findOne({ where: { city_name: city_name } });
        if (cityResult) return handleError(res, 200, 'City name already exists');

        const latLong = await get_lat_long(country_name, city_name)

        const newCity = cityRepository.create({
            country_name,
            city_name,
            latitude: latLong.lat,
            longitude: latLong.lng,
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
        const cityRepository = getRepository(City);

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

        const cityRepository = getRepository(City);

        const cityResult = await cityRepository.findOne({ where: { city_id: city_id } });

        if (!cityResult) return handleError(res, 404, 'City not found');

        const existingCity = await cityRepository.find({ where: { city_name: city_name } });

        if (existingCity && (existingCity.length > 1 || existingCity.length == 1 && existingCity[0].city_id != city_id)) return handleError(res, 400, 'City name already exists');

        const latLong = await get_lat_long(country_name, city_name)

        cityResult.country_name = country_name;
        cityResult.city_name = city_name;
        cityResult.latitude = latLong.lat;
        cityResult.longitude = latLong.lng;

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

        const cityRepository = getRepository(City);

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

        const cityRepository = getRepository(City);

        const cityResult = await cityRepository.find({ where: { country_name: country_name, is_active: true } });

        if (!cityResult) return handleError(res, 404, 'Not cities found');

        return handleSuccess(res, 200, 'Cities found successfully', cityResult);
    } catch (error: any) {
        console.error("Error in getCityByCountryName:", error);
        return handleError(res, 500, error.message);
    }
};

export const createCityTerminal = async (req: Request, res: Response) => {
    try {
        const createCitySchema = Joi.object({
            city_id: Joi.number().required(),
            terminal_name: Joi.string().required(),
            latitude: Joi.number().required(),
            longitude: Joi.number().required()
        });

        const { error, value } = createCitySchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { city_id, terminal_name, latitude, longitude } = value;

        const cityRepository = getRepository(City);
        const terminalRepository = getRepository(Terminal);


        const cityResult = await cityRepository.findOne({ where: { city_id: city_id } });
        if (!cityResult) return handleError(res, 404, 'City not found');

        const findTerminal = await terminalRepository.findOne({ where: { terminal_name, city: city_id, is_deleted: false } });
        if (findTerminal) return handleError(res, 400, "Terminal with this name already exists in the city.");

        const newTerminal = terminalRepository.create({
            city: cityResult,
            terminal_name,
            latitude,
            longitude
        });

        await terminalRepository.save(newTerminal);

        return handleSuccess(res, 200, "Terminal created successfully");
    } catch (error: any) {
        console.error("Error in getCityByCountryName:", error);
        return handleError(res, 500, error.message);
    }
};

export const getAllCityTerminal = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        const pageNumber = parseInt(page as string, 10);
        const pageLimit = parseInt(limit as string, 10);

        const offset = (pageNumber - 1) * pageLimit;

        const terminalRepository = getRepository(Terminal);

        const [terminals, total] = await terminalRepository.findAndCount({
            relations: ['city'], order: { terminal_id: 'desc' },
            where: search ? [
                { terminal_name: Like(`%${search}%`), is_deleted: false },
                { city: { city_name: Like(`%${search}%`) }, is_deleted: false },
                { city: { country_name: Like(`%${search}%`) }, is_deleted: false },
            ] : { is_deleted: false },
            take: pageLimit,
            skip: offset,
        });

        const totalPages = Math.ceil(total / pageLimit);

        return handleSuccess(res, 200, "Terminals retrieved successfully", {
            terminals, pagination: {
                total,
                totalPages,
                currentPage: pageNumber,
                pageSize: pageLimit,
            },
        });
    } catch (error: any) {
        console.error("Error in getCityByCountryName:", error);
        return handleError(res, 500, error.message);
    }
};

export const getCityTerminalById = async (req: Request, res: Response) => {
    try {
        const getCityTerminalSchema = Joi.object({
            terminal_id: Joi.number().required()
        });

        const { error, value } = getCityTerminalSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { terminal_id } = value;

        const terminalRepository = getRepository(Terminal);

        const terminal = await terminalRepository.findOne({ where: { terminal_id }, relations: ['city'] });

        if (!terminal) return handleError(res, 404, 'Terminal not found');

        return handleSuccess(res, 200, "Terminal retrieved successfully", terminal);
    } catch (error: any) {
        console.error("Error in getCityByCountryName:", error);
        return handleError(res, 500, error.message);
    }
};

export const updateCityTerminalById = async (req: Request, res: Response) => {
    try {
        const updateCityTerminalSchema = Joi.object({
            city_id: Joi.number().required(),
            terminal_name: Joi.string().required(),
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
            terminal_id: Joi.number().required()
        });

        const { error, value } = updateCityTerminalSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { terminal_id, city_id, terminal_name, latitude, longitude } = value;

        const terminalRepository = getRepository(Terminal);
        const cityRepository = getRepository(City);

        const existingTerminal = await terminalRepository.findOne({ where: { terminal_id } });
        if (!existingTerminal) return handleError(res, 404, 'Terminal not found');

        const cityResult = await cityRepository.findOne({ where: { city_id } });
        if (!cityResult) return handleError(res, 404, 'City not found');

        const duplicateTerminal = await terminalRepository.findOne({
            where: { terminal_name, city: city_id, is_deleted: false },
        });

        if (duplicateTerminal) return handleError(res, 400, 'Terminal name already exists in this city');

        existingTerminal.city = city_id;
        existingTerminal.terminal_name = terminal_name;
        existingTerminal.latitude = latitude;
        existingTerminal.longitude = longitude;

        await terminalRepository.save(existingTerminal);

        return handleSuccess(res, 200, 'Terminal updated successfully', existingTerminal);
    } catch (error: any) {
        console.error("Error in getCityByCountryName:", error);
        return handleError(res, 500, error.message);
    }
};

export const deleteCityTerminalById = async (req: Request, res: Response) => {
    try {
        const deleteCityTerminalSchema = Joi.object({
            terminal_id: Joi.number().required()
        });

        const { error, value } = deleteCityTerminalSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { terminal_id } = value;

        const terminalRepository = getRepository(Terminal);

        const terminal = await terminalRepository.findOne({ where: { terminal_id } });

        if (!terminal) return handleError(res, 404, 'Terminal not found or already deleted');

        if (terminal) terminal.is_deleted = true

        const deleteTerminal = await terminalRepository.save(terminal)

        return handleSuccess(res, 200, "Terminal deleted successfully");
    } catch (error: any) {
        console.error("Error in getCityByCountryName:", error);
        return handleError(res, 500, error.message);
    }
};

export const getCityTerminalByCityId = async (req: Request, res: Response) => {
    try {
        const getCityTerminalSchema = Joi.object({
            city_id: Joi.number().required()
        });

        const { error, value } = getCityTerminalSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { city_id } = value;

        const terminalRepository = getRepository(Terminal);

        const terminalsResult = await terminalRepository.find({ where: { city: { city_id: city_id }, is_deleted: false }, relations: ['city'] });

        if (!terminalsResult) return handleError(res, 404, 'No terminals found for the provided city ID');

        return handleSuccess(res, 200, "Successfully retrieved terminals", terminalsResult);
    } catch (error: any) {
        console.error("Error in getCityByCountryName:", error);
        return handleError(res, 500, error.message);
    }
};