import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";

export const giftProduct = async (
	userId: string,
	productId: string,
	recipientEmail: string,
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

	const user = await prisma.user.findUnique({
		where: {
			email: recipientEmail,
		},
	});

	if (!user) {
		throw new NotFoundException("There is no user with that email.");
	}

	const product = await prisma.product.update({
		where: {
			id: productId,
			ownerId: userId,
		},
		data: {
			ownerId: user.id,
		},
	});

	return product;
};
