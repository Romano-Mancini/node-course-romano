import { plainToInstance } from "class-transformer";
import { RecipeBody } from "../../../contracts/recipeBody";
import { prisma } from "../../../lib/prisma";
import { RecipeView } from "../../../contracts/recipeView";
import { BadRequestException } from "@nestjs/common";

export const createRecipe = async (body: RecipeBody, userId: string) => {
	try {
		const res = await prisma.recipe.create({
			data: {
				name: body.name,
				description: body.description,
				ownerId: userId,
				ingredients: body.ingredients,
			},
		});

		return plainToInstance(RecipeView, res);
	} catch (error) {
		throw new BadRequestException(
			"A recipe with this name already exists.",
		);
	}
};
