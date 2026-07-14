import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { FridgeView } from "../../../contracts/fridge.view";

export const getAllFridges = async () => {
	const res = await prisma.fridge.findMany();

	return plainToInstance(FridgeView, res, {
		excludeExtraneousValues: true,
	});
};
