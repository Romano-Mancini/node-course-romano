import { plainToInstance } from "class-transformer";
import { RecipeBody } from "../../../contracts/recipeBody";
import { prisma } from "../../../lib/prisma";
import { RecipeView } from "../../../contracts/recipeView";

export const createRecipe = async (body: RecipeBody, userId: string) => {
	const res = await prisma.recipe.create({
		data: {
			name: body.name,
			description: body.description,
			ownerId: userId,
			ingredients: body.ingredients,
		},
	});

	return plainToInstance(RecipeView, res);
};
