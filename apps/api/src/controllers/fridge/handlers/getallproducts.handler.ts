import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { ProductView } from "../../../contracts/product.view";

export const getAllProducts = async (userId: string) => {
	const res = await prisma.product.findMany({ where: { ownerId: userId } });

	return plainToInstance(ProductView, res, { excludeExtraneousValues: true });
};
