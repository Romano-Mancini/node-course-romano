import { InternalServerErrorException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import { generateText } from "ai";
import "dotenv/config";
import { anthropic } from "@ai-sdk/anthropic";
import { plainToInstance } from "class-transformer";
import { RecipeBody } from "../../../contracts/recipeBody";

export const getSuggestions = async (userId: string) => {
	const products = await prisma.product.findMany({
		where: { ownerId: userId },
	});
	const productNames = products.map((product) => product.name);

	try {
		const result = await generateText({
			model: anthropic("claude-sonnet-4-6"),
			prompt: `You are given a list of ingredients that the user possesses.\n INGREDIENTS: ${productNames.join(" ")}\n Return a list of THREE recipes that you would suggest given this list. The suggested recipes can also have some missing ingredients. Reply in JSON format (text only, no markdown formatting) with the following fields: name, description, ingredients. Don’t output anything else. It must be possible to use JSON.parse function from JavaScript on the output. Example output: {"name":"Pasta Carbonara","description":"boil pasta, do other things","ingredients":["Pasta","Eggs","Pecorino","Guanciale","Pepper"]}. I will be able to automatically parse your output into JSON. MAX 3 recipes! If the product list is empty, return 3 student ready recipes in the same format.`,
		});
		const finalRes = (await result.finalStep.response.messages[0]
			.content[0]) as unknown as any;

		const finalJson = JSON.parse(finalRes.text).recipes;
		let toBeReturned: RecipeBody[] = [];

		finalJson.forEach((element: any) => {
			toBeReturned.push(plainToInstance(RecipeBody, element));
		});
		return toBeReturned as RecipeBody[];
	} catch (error: any) {
		throw new InternalServerErrorException(
			"An error occurred during LLM usage.",
		);
	}
};
