import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ProductView } from "../../../contracts/product.view";

export const getProduct = async (userId: string, productId: string) => {
	const product = await prisma.product.findUnique({
		where: {
			id: productId,
		},
	});

	if (!product) {
		throw new NotFoundException("There is no product with this id.");
	}
	if (product.ownerId !== userId) {
		throw new UnauthorizedException("The product is not yours.");
	}

	return plainToInstance(ProductView, product, {
		excludeExtraneousValues: true,
	});
};
