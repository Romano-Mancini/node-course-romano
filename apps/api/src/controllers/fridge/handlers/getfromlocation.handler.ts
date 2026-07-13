import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { ProductView } from "../../../contracts/product.view";

export const getFromLocation = async (userId: string, location: string) => {
	const res = await prisma.product.findMany({
		where: { ownerId: userId, fridge: { location: location } },
	});

	return plainToInstance(ProductView, res, { excludeExtraneousValues: true });
};
