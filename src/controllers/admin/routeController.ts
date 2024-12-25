import { Request, Response } from "express";
import Joi from "joi";
import { getRepository } from "typeorm";

import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { Route } from "../../entities/Route";


export const create_route = async (req: Request, res: Response) => {
    try {
        const createRouteSchema = Joi.object({
            route_name: Joi.string().required(),
            start_location: Joi.string().required(),
            end_location: Joi.string().required(),
            distance_km: Joi.number().optional(),
            estimated_time: Joi.number().optional(),
            description: Joi.string().optional(),
            is_active: Joi.boolean().optional(),
        });

        const { error, value } = createRouteSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const routeRepository = getRepository(Route);
        const newRoute = routeRepository.create(value);

        await routeRepository.save(newRoute);

        return handleSuccess(res, 200, "Route Created Successfully.");
    } catch (error: any) {
        console.error("Error in create_route:", error);
        return handleError(res, 500, error.message);
    }
};


export const get_all_routes = async (req: Request, res: Response) => {
    try {
        const routeRepository = getRepository(Route);
        const routes = await routeRepository.find();
        return handleSuccess(res, 200, "Routes fetched successfully.", routes);
    } catch (error: any) {
        console.error("Error in get_all_routes:", error);
        return handleError(res, 500, error.message);
    }
};


export const get_route_by_id = async (req: Request, res: Response) => {
    try {
        const getRouteSchema = Joi.object({
            route_id: Joi.number().required()
        });

        const { error, value } = getRouteSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { route_id } = value;
        const routeRepository = getRepository(Route);
        const route = await routeRepository.findOneBy({ route_id: route_id });
        if (!route) return handleError(res, 404, "Route not found.");

        return handleSuccess(res, 200, "Route fetched successfully.", route);
    } catch (error: any) {
        console.error("Error in get_route_by_id:", error);
        return handleError(res, 500, error.message);
    }
};


export const update_route = async (req: Request, res: Response) => {
    try {
        const updateRouteSchema = Joi.object({
            route_id: Joi.number().required(),
            route_name: Joi.string().optional(),
            start_location: Joi.string().optional(),
            end_location: Joi.string().optional(),
            distance_km: Joi.number().optional(),
            estimated_time: Joi.number().optional(),
            description: Joi.string().optional(),
        });

        const { error, value } = updateRouteSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { route_id, route_name, start_location, end_location, distance_km, estimated_time, description } = value;
        const routeRepository = getRepository(Route);
        const route = await routeRepository.findOneBy({ route_id: route_id });
        if (!route) return handleError(res, 404, "Route not found.");

        if (route_name) route.route_name = route_name
        if (start_location) route.start_location = start_location
        if (end_location) route.end_location = end_location
        if (distance_km) route.distance_km = distance_km
        if (estimated_time) route.estimated_time = estimated_time
        if (description) route.description = description

        await routeRepository.save(route);

        return handleSuccess(res, 200, "Route Updated Successfully.");
    } catch (error: any) {
        console.error("Error in update_route:", error);
        return handleError(res, 500, error.message);
    }
};


export const update_route_status = async (req: Request, res: Response) => {
    try {
        const updateRouteStatusSchema = Joi.object({
            route_id: Joi.number().required(),
            is_active: Joi.boolean().required(),
        });

        const { error, value } = updateRouteStatusSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { route_id, is_active } = value;
        const routeRepository = getRepository(Route);
        const route = await routeRepository.findOneBy({ route_id: route_id });
        if (!route) return handleError(res, 404, "Route not found.");
        let response_message = 'Route Activated Successfully '
        if (!is_active) response_message = 'Route De-activated Successfully'
        route.is_active = is_active
        await routeRepository.save(route);

        return handleSuccess(res, 200, response_message);
    } catch (error: any) {
        console.error("Error in update_route:", error);
        return handleError(res, 500, error.message);
    }
};


export const delete_route = async (req: Request, res: Response) => {
    try {
        const deleteRouteSchema = Joi.object({
            route_id: Joi.number().required()
        });

        const { error, value } = deleteRouteSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { route_id } = value;
        const routeRepository = getRepository(Route);
        const route = await routeRepository.findOneBy({ route_id: route_id });
        if (!route) return handleError(res, 404, "Route not found.");

        await routeRepository.remove(route);

        return handleSuccess(res, 200, "Route Deleted Successfully.");
    } catch (error: any) {
        console.error("Error in delete_route:", error);
        return handleError(res, 500, error.message);
    }
};
