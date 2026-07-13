import { createRecipe } from "../../controllers/fridge/handlers/create.recipe.handler";
import { deleteRecipe } from "../../controllers/fridge/handlers/delete.recipe.handler";
import { changeRecipe } from "../../controllers/fridge/handlers/change.recipe";
import { getAllRecipes } from "../../controllers/fridge/handlers/getall.recipe";
import { getRecipe } from "../../controllers/fridge/handlers/get.recipe";
import { getMissingIngredients } from "../../controllers/fridge/handlers/getmissing.recipe";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { expect } from "chai";
import { ProductType } from "../../contracts/product.body";
import { NotFoundException } from "@nestjs/common";

const fridgeFixtures = [
	{
		location: "Oude Markt",
		capacity: 10,
	},
	{
		location: "Grote Markt",
		capacity: 1,
	},
];

const userFixtures = [
	{
		name: "test1",
		surname: "testsurname1",
		email: "test-user+1@panenco.com",
		password: "password1",
	},
	{
		name: "test2",
		surname: "testsurname2",
		email: "test-user+2@panenco.com",
		password: "password2",
	},
	{
		name: "test3",
		surname: "testsurname3",
		email: "test-user+3@panenco.com",
		password: "password3",
	},
];

describe("Recipe Handlers", () => {
	let users: any[];
	let fridges: any[];

	beforeEach(async () => {
		await prisma.product.deleteMany();
		await prisma.recipe.deleteMany();
		await prisma.fridge.deleteMany();
		await prisma.user.deleteMany();

		users = await Promise.all(
			userFixtures.map(async (fixture) => {
				const hashedPassword = await bcrypt.hash(fixture.password, 10);

				return prisma.user.create({
					data: {
						name: fixture.name,
						surname: fixture.surname,
						email: fixture.email,
						password: hashedPassword,
					},
				});
			}),
		);

		fridges = await Promise.all(
			fridgeFixtures.map((fixture) =>
				prisma.fridge.create({
					data: fixture,
				}),
			),
		);
	});

	describe("createRecipe handler", () => {
		it("should create a recipe", async () => {
			const recipe = await createRecipe(
				{
					name: "Panzerotto",
					description: "Authentic southern Italian recipe",
					ingredients: ["Flour", "Olive oil", "Mozzarella", "Tomato"],
				},
				users[0].id,
			);

			expect(recipe.name).to.equal("Panzerotto");
			expect(recipe.description).to.equal(
				"Authentic southern Italian recipe",
			);
			expect(recipe.ingredients).to.deep.equal([
				"Flour",
				"Olive oil",
				"Mozzarella",
				"Tomato",
			]);
		});

		it("should assign the recipe to the correct user", async () => {
			const recipe = await createRecipe(
				{
					name: "Carbonara",
					description: "Classic Roman pasta recipe",
					ingredients: ["Pasta", "Eggs", "Pecorino", "Guanciale"],
				},
				users[0].id,
			);

			const savedRecipe = await prisma.recipe.findUnique({
				where: {
					recipe_owner_name_unique: {
						name: recipe.name,
						ownerId: recipe.ownerId,
					},
				},
			});

			expect(savedRecipe?.ownerId).to.equal(users[0].id);
		});
	});

	describe("deleteRecipe handler", () => {
		it("should delete a recipe", async () => {
			const recipe = await createRecipe(
				{
					name: "Panzerotto",
					description: "Authentic southern Italian recipe",
					ingredients: ["Flour", "Olive oil", "Mozzarella", "Tomato"],
				},
				users[0].id,
			);

			await deleteRecipe(recipe.name, recipe.ownerId);

			const recipes = await prisma.recipe.findMany({
				where: { name: recipe.name, ownerId: recipe.ownerId },
			});

			expect(recipes).has.lengthOf(0);
		});
	});

	describe("changeRecipe handler", () => {
		it("should change a recipe", async () => {
			const recipe = await createRecipe(
				{
					name: "Panzerotto",
					description: "Authentic southern Italian recipe",
					ingredients: ["Flour", "Olive oil", "Mozzarella", "Tomato"],
				},
				users[0].id,
			);

			const newIngredients = [
				"Salt",
				"Flour",
				"Olive oil",
				"Mozzarella",
				"Tomato",
			];
			const body = {
				description: "My grandma's recipe",
				ingredients: newIngredients,
			};
			await changeRecipe(body, recipe.ownerId, recipe.name);

			const recipes = await prisma.recipe.findMany({
				where: { name: recipe.name, ownerId: recipe.ownerId },
			});
			expect(recipes[0].description).to.deep.equal("My grandma's recipe");
			expect(recipes[0].ingredients).to.deep.equal(newIngredients);
		});
	});

	describe("getAllRecipes handler", () => {
		it("should get all recipes of the user", async () => {
			const recipe = await createRecipe(
				{
					name: "Panzerotto",
					description: "Authentic southern Italian recipe",
					ingredients: ["Flour", "Olive oil", "Mozzarella", "Tomato"],
				},
				users[0].id,
			);

			const recipe2 = await createRecipe(
				{
					name: "Pizza",
					description: "Most famous Italian recipe",
					ingredients: ["Olive oil", "Mozzarella", "Tomato"],
				},
				users[0].id,
			);

			const res = await getAllRecipes(users[0].id);
			expect(res).has.lengthOf(2);
			expect(res[0].name).to.equal("Panzerotto");
			expect(res[0].description).to.equal(
				"Authentic southern Italian recipe",
			);
			expect(res[0].ingredients).to.deep.equal([
				"Flour",
				"Olive oil",
				"Mozzarella",
				"Tomato",
			]);

			expect(res).has.lengthOf(2);
			expect(res[1].name).to.equal("Pizza");
			expect(res[1].description).to.equal("Most famous Italian recipe");
			expect(res[1].ingredients).to.deep.equal([
				"Olive oil",
				"Mozzarella",
				"Tomato",
			]);
		});

		it("should not get recipes of another user", async () => {
			const recipe = await createRecipe(
				{
					name: "Panzerotto",
					description: "Authentic southern Italian recipe",
					ingredients: ["Flour", "Olive oil", "Mozzarella", "Tomato"],
				},
				users[0].id,
			);

			const recipe2 = await createRecipe(
				{
					name: "Pizza",
					description: "Most famous Italian recipe",
					ingredients: ["Olive oil", "Mozzarella", "Tomato"],
				},
				users[0].id,
			);

			const res = await getAllRecipes(users[1].id);
			expect(res).has.lengthOf(0);
		});
	});

	describe("getAllRecipes handler", () => {
		it("should get the recipe of the user", async () => {
			const recipe = await createRecipe(
				{
					name: "Panzerotto",
					description: "Authentic southern Italian recipe",
					ingredients: ["Flour", "Olive oil", "Mozzarella", "Tomato"],
				},
				users[0].id,
			);

			const res = await getRecipe(users[0].id, recipe.name);
			expect(res.name).to.equal("Panzerotto");
			expect(res.description).to.equal(
				"Authentic southern Italian recipe",
			);
			expect(res.ingredients).to.deep.equal([
				"Flour",
				"Olive oil",
				"Mozzarella",
				"Tomato",
			]);
		});

		it("should not get recipes of another user", async () => {
			const recipe = await createRecipe(
				{
					name: "Panzerotto",
					description: "Authentic southern Italian recipe",
					ingredients: ["Flour", "Olive oil", "Mozzarella", "Tomato"],
				},
				users[0].id,
			);

			const res = await getRecipe(users[1].id, recipe.name);
			expect(res).to.be.null;
		});
	});

	describe("getMissingIngredients handler", () => {
		it("should return the missing ingredients of a recipe", async () => {
			await createRecipe(
				{
					name: "Pizza",
					description: "Most famous Italian recipe",
					ingredients: ["Flour", "Olive oil", "Mozzarella", "Tomato"],
				},
				users[0].id,
			);

			await prisma.product.createMany({
				data: [
					{
						name: "Flour",
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
						type: ProductType.FOOD,
						size: 1,
					},
					{
						name: "Tomato",
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
						type: ProductType.FOOD,
						size: 1,
					},
				],
			});

			const res = await getMissingIngredients(users[0].id, "Pizza");

			expect(res).to.deep.equal(["Olive oil", "Mozzarella"]);
		});

		it("should return an empty array when all ingredients are owned", async () => {
			await createRecipe(
				{
					name: "Pizza",
					description: "Most famous Italian recipe",
					ingredients: ["Flour", "Olive oil", "Mozzarella", "Tomato"],
				},
				users[0].id,
			);

			await prisma.product.createMany({
				data: [
					{
						name: "Flour",
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
						type: ProductType.FOOD,
						size: 1,
					},
					{
						name: "Tomato",
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
						type: ProductType.FOOD,
						size: 1,
					},
					{
						name: "Mozzarella",
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
						type: ProductType.FOOD,
						size: 1,
					},
					{
						name: "Olive oil",
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
						type: ProductType.FOOD,
						size: 1,
					},
				],
			});

			const res = await getMissingIngredients(users[0].id, "Pizza");

			expect(res).to.deep.equal([]);
		});

		it("should throw NotFoundException when the recipe does not belong to the user", async () => {
			await createRecipe(
				{
					name: "Pizza",
					description: "Most famous Italian recipe",
					ingredients: ["Flour", "Tomato"],
				},
				users[0].id,
			);

			try {
				await getMissingIngredients(users[1].id, "Pizza");
				expect.fail("Expected NotFoundException");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundException);
				expect(err.message).to.equal("Recipe not found");
			}
		});
	});
});
