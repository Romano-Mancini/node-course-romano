import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { RecipeView } from "../../../contracts/recipeView";

export const getRecipe = async (userId: string, recipeName: string) => {
	const res = await prisma.recipe.findUnique({
		where: {
			recipe_owner_name_unique: { ownerId: userId, name: recipeName },
		},
	});

	return plainToInstance(RecipeView, res, {
		excludeExtraneousValues: true,
	});
};
