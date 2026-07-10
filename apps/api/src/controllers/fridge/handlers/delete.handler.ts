import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";

export const deleteProduct = async (userId: string, productId: string) => {
	const res = await prisma.product.findUnique({
		where: { id: productId },
	});

	if (!res) {
		throw new NotFoundException("Couldn't find the product.");
	}
	if (res.ownerId !== userId) {
		throw new NotFoundException("You are not the owner of the product.");
	}

	return await prisma.product.delete({
		where: { id: productId },
	});
};
