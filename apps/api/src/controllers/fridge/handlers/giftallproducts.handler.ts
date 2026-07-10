import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { ProductView } from "../../../contracts/product.view";

export const giftAllProducts = async (userId: string, recipientId: string) => {
	const res = await prisma.product.updateMany({
		where: { ownerId: userId },
		data: { ownerId: recipientId },
	});

	return plainToInstance(ProductView, res, { excludeExtraneousValues: true });
};
