import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { ProductView } from "../../../contracts/product.view";
import { RecipeView } from "../../../contracts/recipeView";

export const getAllRecipes = async (userId: string) => {
	const res = await prisma.recipe.findMany({ where: { ownerId: userId } });

	return plainToInstance(RecipeView, res, {
		excludeExtraneousValues: true,
	});
};
