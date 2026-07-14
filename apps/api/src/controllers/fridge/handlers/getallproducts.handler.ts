import { plainToInstance } from "class-transformer";
import { ProductView } from "../../../contracts/product.view";
import { prisma } from "../../../lib/prisma";

export const getAllProducts = async (
	userId: string,
	location?: string,
	fridgeId?: string,
) => {
	const where: {
		ownerId: string;
		fridgeId?: {
			contains: string;
			mode: "insensitive";
		};
		fridge?: {
			location: {
				contains: string;
				mode: "insensitive";
			};
		};
	} = {
		ownerId: userId,
	};

	if (fridgeId) {
		where.fridgeId = {
			contains: fridgeId,
			mode: "insensitive",
		};
	}

	if (location) {
		where.fridge = {
			location: {
				contains: location,
				mode: "insensitive",
			},
		};
	}

	const products = await prisma.product.findMany({
		where,
	});

	return plainToInstance(ProductView, products, {
		excludeExtraneousValues: true,
	});
};
