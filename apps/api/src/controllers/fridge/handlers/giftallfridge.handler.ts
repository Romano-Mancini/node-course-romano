import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { NotFoundException } from "@nestjs/common";
import { ProductView } from "../../../contracts/product.view";

export const giftAllFridgeProducts = async (
	userId: string,
	fridgeId: string,
	receiverEmail: string,
) => {
	const res = await prisma.fridge.findUnique({ where: { id: fridgeId } });
	if (!res) {
		throw new NotFoundException("There is no fridge with this id.");
	}

	const user = await prisma.user.findUnique({
		where: { email: receiverEmail },
	});
	if (!user) {
		throw new NotFoundException("There is no user with this email.");
	}

	const fridge = await prisma.product.updateMany({
		where: {
			fridgeId: fridgeId,
			ownerId: userId,
		},
		data: {
			ownerId: user.id,
		},
	});

	return fridge;
};
