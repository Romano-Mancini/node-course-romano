import { prisma } from "../../../lib/prisma";
import { NotFoundException } from "@nestjs/common";

export const getMissingIngredients = async (
	userId: string,
	recipeName: string,
) => {
	const recipe = await prisma.recipe.findFirst({
		where: {
			ownerId: userId,
			name: recipeName,
		},
	});

	if (!recipe) {
		throw new NotFoundException("Recipe not found");
	}

	const products = await prisma.product.findMany({
		where: {
			ownerId: userId,
		},
		select: {
			name: true,
		},
	});

	// Normalize product names for case-insensitive comparison
	const ownedProducts = new Set(
		products.map((p) => p.name.trim().toLowerCase()),
	);

	const missingIngredients = recipe.ingredients.filter(
		(ingredient) => !ownedProducts.has(ingredient.trim().toLowerCase()),
	);

	return missingIngredients;
};
