import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { ProductView } from "../../../contracts/product.view";
import { NotFoundException } from "@nestjs/common";

export const giftAllProducts = async (
	userId: string,
	recipientEmail: string,
) => {
	const user = await prisma.user.findUnique({
		where: { email: recipientEmail },
	});

	if (!user) {
		throw new NotFoundException("There is no user with that email.");
	}
	const res = await prisma.product.updateMany({
		where: { ownerId: userId },
		data: { ownerId: user.id },
	});

	return plainToInstance(ProductView, res, { excludeExtraneousValues: true });
};
