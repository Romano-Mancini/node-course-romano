import { prisma } from "../../../lib/prisma";

export const deleteRecipe = async (recipeName: string, userId: string) => {
	const res = await prisma.recipe.deleteMany({
		where: {
			name: recipeName,
			ownerId: userId, //TODO: check if correct
		},
	});

	return res;
};
