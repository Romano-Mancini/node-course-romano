import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { FridgeBody } from "../../../contracts/fridge.body";
import { FridgeView } from "../../../contracts/fridge.view";

export const create = async (body: FridgeBody) => {
	const fridge = await prisma.fridge.create({
		data: {
			location: body.location,
			capacity: body.capacity,
		},
	});
	const instance = plainToInstance(FridgeView, fridge, {
		excludeExtraneousValues: true,
	});
	return instance;
};
