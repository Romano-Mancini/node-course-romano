import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { NotFoundException } from "@nestjs/common";
import { ProductView } from "../../../contracts/product.view";

export const getAllFridgeProducts = async (
	userId: string,
	fridgeId: string,
) => {
	const res = await prisma.fridge.findUnique({ where: { id: fridgeId } });
	if (!res) {
		throw new NotFoundException("There is no fridge with this id.");
	}

	const fridge = await prisma.product.findMany({
		where: {
			fridgeId: fridgeId,
			ownerId: userId,
		},
	});

	const instance = plainToInstance(ProductView, fridge, {
		excludeExtraneousValues: true,
	});
	return instance;
};
