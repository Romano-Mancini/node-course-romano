import { prisma } from "../../../lib/prisma";
import { UpdateBody } from "../../../contracts/update.body";

export const changeRecipe = async (
	body: UpdateBody,
	userId: string,
	recipeName: string,
) => {
	const data: Record<string, any> = {};

	if (body.description !== undefined) {
		data.description = body.description;
	}

	if (body.ingredients !== undefined) {
		data.ingredients = body.ingredients;
	}

	return await prisma.recipe.updateMany({
		where: { name: recipeName, ownerId: userId },
		data: data,
	});
};
