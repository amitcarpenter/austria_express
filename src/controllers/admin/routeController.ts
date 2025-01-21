import { Request, Response } from "express";
import Joi from "joi";
import { getRepository, Like, Not } from "typeorm";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { Route } from "../../entities/Route";
import { City } from "../../entities/City";
import { Route_Stops } from "../../entities/RouteStop";
import { distance_checker } from "../../utils/function";

export const create_route = async (req: Request, res: Response) => {
    try {
        const createRouteSchema = Joi.object({
            route_direction: Joi.string().required(),
            pickup_point: Joi.number().required(),
            dropoff_point: Joi.number().required(),
            stop_city_ids: Joi.array().items(Joi.string()).optional().allow(null, ""),
            description: Joi.string().optional(),
        });

        const { error, value } = createRouteSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const routeRepository = getRepository(Route);
        const cityRepository = getRepository(City);
        const routeStopsRepository = getRepository(Route_Stops);

        const { route_direction, pickup_point, dropoff_point, stop_city_ids, description } = value;

        const existingRoute = await routeRepository.findOne({ where: { pickup_point: { city_id: pickup_point }, dropoff_point: { city_id: dropoff_point }, is_deleted: false } })
        if (existingRoute) return handleError(res, 409, 'A route with the same pickup and dropoff points already exists.');

        const findPickupCityResult = await cityRepository.findOne({ where: { city_id: pickup_point } });
        if (!findPickupCityResult) return handleError(res, 404, "Pickup city not found.");

        const findDropoffCityResult = await cityRepository.findOne({ where: { city_id: dropoff_point } });
        if (!findDropoffCityResult) return handleError(res, 404, "Dropoff city not found.");

        const units = 'metric';

        const distances: any = await distance_checker(units, `${findPickupCityResult.latitude},${findPickupCityResult.longitude}`, `${findDropoffCityResult.latitude},${findDropoffCityResult.longitude}`);

        if (!distances || !distances.distanceValue) return handleError(res, 400, "Unable to calculate distance. Please check the input coordinates.");

        const distance_km = parseFloat((distances.distanceValue / 1000).toFixed(2));

        const newRouteData = {
            route_direction,
            pickup_point,
            dropoff_point,
            description,
            distance_km
        };

        const newRoute = routeRepository.create(newRouteData);
        await routeRepository.save(newRoute);

        if (stop_city_ids) {
            for (let i = 0; i < stop_city_ids.length; i++) {
                const stop_city_id = stop_city_ids[i];
                const routeEntity = await routeRepository.findOne({ where: { route_id: newRoute.route_id } });
                if (!routeEntity) return handleError(res, 404, "Route not found.");
                const newStopData = {
                    route_id: routeEntity,
                    stop_city_id,
                    stop_order: i + 1
                };
                const newStop = routeStopsRepository.create(newStopData);
                await routeStopsRepository.save(newStop);
            }
        }

        return handleSuccess(res, 200, "Route Created Successfully.");
    } catch (error: any) {
        console.error("Error in create_route:", error);
        return handleError(res, 500, error.message);
    }
};

export const get_all_routes = async (req: Request, res: Response) => {
    try {
        const routeRepository = getRepository(Route);
        const routes = await routeRepository.find({ where: { is_deleted: false }, relations: ['pickup_point', 'dropoff_point'] });
        if (!routes.length) return handleError(res, 404, 'No routes found.');
        return handleSuccess(res, 200, "Routes fetched successfully.", routes);
    } catch (error: any) {
        console.error("Error in get_all_routes:", error);
        return handleError(res, 500, error.message);
    }
};

export const get_all_routes_by_search_limit = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search = '', filter = '' } = req.query;

        const pageNumber = parseInt(page as string, 10);
        const pageLimit = parseInt(limit as string, 10);

        const offset = (pageNumber - 1) * pageLimit;

        const routeRepository = getRepository(Route);

        const [routes, total] = await routeRepository.findAndCount({
            where: {
                is_deleted: false,
                ...(filter && { route_direction: Like(`%${filter}%`) }),
                ...(search && {
                    pickup_point: { city_name: Like(`%${search}%`) }
                }),
                ...(search && {
                    pickup_point: { country_name: Like(`%${search}%`) }
                }),
                ...(search && {
                    dropoff_point: { city_name: Like(`%${search}%`) }
                }),
                ...(search && {
                    dropoff_point: { country_name: Like(`%${search}%`) }
                })
            },
            relations: ['pickup_point', 'dropoff_point'],
            take: pageLimit,
            skip: offset,
        });

        const totalPages = Math.ceil(total / pageLimit);

        return handleSuccess(res, 200, "Routes fetched successfully.", {
            routes,
            pagination: {
                total,
                totalPages,
                currentPage: pageNumber,
                pageSize: pageLimit,
            },
        });
    } catch (error: any) {
        console.error("Error in get_all_routes_by_search_limit:", error);
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
        const route = await routeRepository.findOne({ where: { route_id: route_id }, relations: ['pickup_point', 'dropoff_point'] });

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
            route_direction: Joi.string().required(),
            pickup_point: Joi.string().required(),
            dropoff_point: Joi.string().required(),
            stop_city_ids: Joi.array().items(Joi.string()).required(),
            description: Joi.string().optional(),
        });

        const { error, value } = updateRouteSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { route_id, route_direction, pickup_point, dropoff_point, stop_city_ids, description } = value;

        const routeRepository = getRepository(Route);
        const cityRepository = getRepository(City);
        const routeStopsRepository = getRepository(Route_Stops);

        const route = await routeRepository.findOne({ where: { route_id: route_id } });
        if (!route) return handleError(res, 404, "Route not found.");

        const existingRoute = await routeRepository.findOne({
            where: {
                pickup_point,
                dropoff_point,
                route_id: Not(route_id)
            },
        });
        if (existingRoute) return handleError(res, 409, "A route with the same pickup and dropoff points already exists.");

        const findPickupCityResult = await cityRepository.findOne({ where: { city_id: pickup_point } });
        if (!findPickupCityResult) return handleError(res, 404, "Pickup city not found.");

        const findDropoffCityResult = await cityRepository.findOne({ where: { city_id: dropoff_point } });
        if (!findDropoffCityResult) return handleError(res, 404, "Dropoff city not found.");

        let distance_km;
        if (findPickupCityResult && findDropoffCityResult) {
            // Calculate the distance if coordinates are provided
            const units = 'metric';
            const distances: any = await distance_checker(units, `${findPickupCityResult.latitude},${findPickupCityResult.longitude}`, `${findDropoffCityResult.latitude},${findDropoffCityResult.longitude}`);

            if (!distances || !distances.distanceValue) {
                return handleError(res, 400, "Unable to calculate distance. Please check the input coordinates.");
            }

            distance_km = parseFloat((distances.distanceValue / 1000).toFixed(2)); // Convert meters to kilometers
        }

        if (route_direction) route.route_direction = route_direction
        if (pickup_point) route.pickup_point = pickup_point
        if (dropoff_point) route.dropoff_point = dropoff_point
        if (distance_km) route.distance_km = distance_km
        if (description) route.description = description

        await routeRepository.save(route);
        await routeStopsRepository.delete({ route: { route_id: route_id } });

        for (let i = 0; i < stop_city_ids.length; i++) {
            const stop_city_id = stop_city_ids[i];

            // Fetch the full Route entity for the relation
            const routeEntity = await routeRepository.findOne({ where: { route_id: route_id } });
            if (!routeEntity) return handleError(res, 404, "Route not found.");

            // Create a new stop entry for the route
            const newStopData = {
                route_id: routeEntity,  // Pass the entire Route entity instead of just the route_id
                stop_city_id,
                stop_order: i + 1 // Order the stops starting from 1
            };

            const newStop = routeStopsRepository.create(newStopData);
            await routeStopsRepository.save(newStop);
        }

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
        route.is_deleted = is_active
        await routeRepository.save(route);

        return handleSuccess(res, 200, response_message);
    } catch (error: any) {
        console.error("Error in update_route:", error);
        return handleError(res, 500, error.message);
    }
};

export const delete_route = async (req: Request, res: Response) => {
    try {
        // Validate the request body
        const deleteRouteSchema = Joi.object({
            route_id: Joi.number().required()
        });

        const { error, value } = deleteRouteSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { route_id } = value;
        const routeRepository = getRepository(Route);

        // Fetch the route to delete
        const route = await routeRepository.findOne({
            where: { route_id: route_id }
        });

        if (!route) {
            return handleError(res, 404, "Route not found or already deleted.");
        }

        if (route) route.is_deleted = true

        // Remove the route
        await routeRepository.save(route);

        return handleSuccess(res, 200, "Route Deleted Successfully.");
    } catch (error: any) {
        console.error("Error in delete_route:", { error: error.message, route_id: req.body?.route_id });
        return handleError(res, 500, error.message);
    }
};