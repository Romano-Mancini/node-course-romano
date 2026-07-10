import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";

export const giftProduct = async (
	userId: string,
	productId: string,
	receiverId: string,
) => {
	const res = await prisma.user.findUnique({ where: { id: userId } });
	if (!res) {
		throw new NotFoundException("Invalid user id.");
	}

	const actualProduct = await prisma.product.findUnique({
		where: { id: productId },
	});
	if (!actualProduct) {
		throw new NotFoundException("Invalid product id.");
	}
	if (actualProduct.ownerId !== userId) {
		throw new NotFoundException("You are not the owner of the product.");
	}

	return await prisma.product.update({
		where: {
			id: productId,
		},
		data: {
			ownerId: receiverId,
		},
	});
};
