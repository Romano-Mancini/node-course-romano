import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { FridgeBody } from "../../../contracts/fridge.body";

export const create = async (body: FridgeBody) => {
	const fridge = await prisma.fridge.create({
		data: {
			location: body.location,
			capacity: body.capacity,
		},
	});
	const instance = plainToInstance(FridgeBody, fridge, {
		excludeExtraneousValues: true,
	});
	return instance;
};
