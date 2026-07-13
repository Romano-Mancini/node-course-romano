import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { ProductView } from "../../../contracts/product.view";

export const deleteWholeFridge = async (userId: string, fridgeId: string) => {
	const res = await prisma.fridge.findUnique({ where: { id: fridgeId } });

	if (!res) {
		throw new NotFoundException("There is no fridge with that id.");
	}

	return await prisma.product.deleteMany({
		where: { fridgeId: fridgeId, ownerId: userId },
	});
};
