import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { ProductBody } from "../../../contracts/product.body";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ProductView } from "../../../contracts/product.view";

export const putProduct = async (
	userId: string,
	fridgeId: string,
	body: ProductBody,
) => {
	const fridge = await prisma.fridge.findUnique({
		where: { id: fridgeId },
	});

	if (!fridge) {
		throw new NotFoundException("Fridge not found.");
	}

	const currentCapacity = await prisma.product.aggregate({
		where: {
			fridgeId: fridgeId,
		},
		_sum: {
			size: true,
		},
	});

	const totalSize = currentCapacity._sum.size ?? 0;

	const maxFridgeCapacity = await prisma.fridge.findUnique({
		where: {
			id: fridgeId,
		},
		select: {
			capacity: true,
		},
	});

	if (totalSize + body.size > maxFridgeCapacity.capacity) {
		throw new BadRequestException(
			"This request would exceed the fridge's capacity.",
		);
	}

	const product = await prisma.product.create({
		data: {
			name: body.name,
			type: body.type,
			size: body.size,
			owner: {
				connect: {
					id: userId,
				},
			},
			fridge: {
				connect: {
					id: fridgeId,
				},
			},
		},
	});

	const instance = plainToInstance(ProductView, product, {
		excludeExtraneousValues: true,
	});

	return instance;
};
