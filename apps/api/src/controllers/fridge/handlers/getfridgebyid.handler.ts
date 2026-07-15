import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { FridgeView } from "../../../contracts/fridge.view";
import { NotFoundException } from "@nestjs/common";

export const getFridgeById = async (fridgeId: string) => {
	const res = await prisma.fridge.findUnique({ where: { id: fridgeId } });
	if (!res) {
		throw new NotFoundException("There is no fridge with that ID.");
	}
	return plainToInstance(FridgeView, res, { excludeExtraneousValues: true });
};
