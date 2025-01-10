import { Request, Response } from "express";
import Joi from "joi";
import { getRepository } from "typeorm";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";
import { Route } from "../../entities/Route";
import { Tbl_City } from "../../entities/City";
import { Route_Stops } from "../../entities/RouteStop";
import { distance_checker } from "../../utils/function";

export const create_route = async (req: Request, res: Response) => {
    try {
        const createRouteSchema = Joi.object({
            route_direction: Joi.string().required(),
            pickup_point: Joi.string().required(),
            dropoff_point: Joi.string().required(),
            stop_city_ids: Joi.array().items(Joi.string()).required(),
            description: Joi.string().optional(),
        });

        const { error, value } = createRouteSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const routeRepository = getRepository(Route);
        const cityRepository = getRepository(Tbl_City);
        const routeStopsRepository = getRepository(Route_Stops);

        const { route_direction, pickup_point, dropoff_point, stop_city_ids, description } = value;

        const findPickupCityResult = await cityRepository.findOne({ where: { city_id: pickup_point } });
        if (!findPickupCityResult) return handleError(res, 404, "Pickup city not found.");

        const findDropoffCityResult = await cityRepository.findOne({ where: { city_id: dropoff_point } });
        if (!findDropoffCityResult) return handleError(res, 404, "Dropoff city not found.");

        const units = 'metric';

        const distances: any = await distance_checker(units, `${findPickupCityResult.latitude},${findPickupCityResult.longitude}`, `${findDropoffCityResult.latitude},${findDropoffCityResult.longitude}`);

        if (!distances || !distances.distanceValue) return handleError(res, 400, "Unable to calculate distance. Please check the input coordinates.");

        const distance_km = parseFloat((distances.distanceValue / 1000).toFixed(2)); // Convert meters to kilometers and format to 2 decimals

        const newRouteData = {
            route_direction,
            pickup_point,
            dropoff_point,
            description,
            distance_km
        };

        const newRoute = routeRepository.create(newRouteData);
        await routeRepository.save(newRoute);

        for (let i = 0; i < stop_city_ids.length; i++) {
            const stop_city_id = stop_city_ids[i];

            // Fetch the full Route entity for the relation
            const routeEntity = await routeRepository.findOne({ where: { route_id: newRoute.route_id } });
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

        return handleSuccess(res, 200, "Route Created Successfully.");
    } catch (error: any) {
        console.error("Error in create_route:", error);
        return handleError(res, 500, error.message);
    }
};

export const get_all_routes = async (req: Request, res: Response) => {
    try {
        const routeRepository = getRepository(Route);
        const routes = await routeRepository.find({ relations: ['pickup_point', 'dropoff_point'] });
        if (!routes.length) return handleError(res, 404, 'No routes found.');
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
        const cityRepository = getRepository(Tbl_City);
        const routeStopsRepository = getRepository(Route_Stops);

        const route = await routeRepository.findOne({ where: { route_id: route_id } });
        if (!route) return handleError(res, 404, "Route not found.");

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
        await routeStopsRepository.delete({ route_id: route_id });

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

        // Remove the route
        await routeRepository.remove(route);

        return handleSuccess(res, 200, "Route Deleted Successfully.");
    } catch (error: any) {
        console.error("Error in delete_route:", { error: error.message, route_id: req.body?.route_id });
        return handleError(res, 500, error.message);
    }
};