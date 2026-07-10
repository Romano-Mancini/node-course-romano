import { prisma } from "../../../lib/prisma";

export const deleteAllProducts = async (userId: string) => {
	const res = await prisma.product.deleteMany({ where: { ownerId: userId } });

	return res;
};
