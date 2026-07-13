import { prisma } from "../../../lib/prisma";

export const deleteRecipe = async (
	recipeName: string,
	userId: string,
): Promise<number> => {
	const res = await prisma.recipe.deleteMany({
		where: {
			name: recipeName,
			ownerId: userId,
		},
	});
	return res.count;
};
