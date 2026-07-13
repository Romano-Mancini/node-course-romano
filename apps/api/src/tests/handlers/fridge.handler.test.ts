import { expect } from "chai";
import { beforeEach, describe, it } from "mocha";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { NotFoundException } from "@nestjs/common";

import { create } from "../../controllers/fridge/handlers/create.handler";
import { prisma } from "../../lib/prisma";
import { FridgeBody } from "../../contracts/fridge.body";
import { getAllFridgeProducts } from "../../controllers/fridge/handlers/getallfridge.handler";
import { giftAllFridgeProducts } from "../../controllers/fridge/handlers/giftallfridge.handler";
import { deleteWholeFridge } from "../../controllers/fridge/handlers/deletewholefridge.handler";
import { getFromLocation } from "../../controllers/fridge/handlers/getfromlocation.handler";
import { ProductType } from "../../contracts/product.body";

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

describe("Fridge handlers", () => {
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

	describe("create handler", () => {
		it("should create a fridge", async () => {
			const fridgeBody: FridgeBody = {
				location: "Arenberg Castle",
				capacity: 15,
			};

			const res = await create(fridgeBody);

			expect(res.location).equal("Arenberg Castle");
			expect(res.capacity).equal(15);
		});
	});

	describe("getAllFridgeProducts handler", () => {
		it("should return all products owned by the user in a fridge", async () => {
			await prisma.product.createMany({
				data: [
					{
						name: "Bread",
						type: ProductType.FOOD,
						size: 2,
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
					},
					{
						name: "Milk",
						type: ProductType.DRINK,
						size: 1,
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
					},
				],
			});

			const res = await getAllFridgeProducts(users[0].id, fridges[0].id);

			expect(res).to.have.length(2);
			expect(res[0].ownerId).equal(users[0].id);
			expect(res[1].ownerId).equal(users[0].id);
		});

		it("should not return products owned by another user", async () => {
			await prisma.product.createMany({
				data: [
					{
						name: "Bread",
						type: ProductType.FOOD,
						size: 2,
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
					},
					{
						name: "Chocolate",
						type: ProductType.FOOD,
						size: 1,
						ownerId: users[1].id,
						fridgeId: fridges[0].id,
					},
				],
			});

			const res = await getAllFridgeProducts(users[0].id, fridges[0].id);

			expect(res).to.have.length(1);
			expect(res[0].name).equal("Bread");
		});

		it("should return an empty array when the fridge has no products", async () => {
			const res = await getAllFridgeProducts(users[0].id, fridges[0].id);

			expect(res).to.be.an("array");
			expect(res).to.have.length(0);
		});

		it("should throw when fridge does not exist", async () => {
			try {
				await getAllFridgeProducts(users[0].id, randomUUID());

				expect.fail("Expected error");
			} catch (err: any) {
				expect(err).instanceOf(NotFoundException);
				expect(err.message).equal("There is no fridge with this id.");
			}
		});

		it("should not return products from another fridge", async () => {
			await prisma.product.create({
				data: {
					name: "Eggs",
					type: ProductType.FOOD,
					size: 3,
					ownerId: users[0].id,
					fridgeId: fridges[1].id,
				},
			});

			const res = await getAllFridgeProducts(users[0].id, fridges[0].id);

			expect(res).to.have.length(0);
		});
	});

	describe("giftAllFridgeProducts handler", () => {
		it("should transfer all products in a fridge owned by the user to the receiver", async () => {
			await prisma.product.createMany({
				data: [
					{
						name: "Bread",
						type: ProductType.FOOD,
						size: 2,
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
					},
					{
						name: "Milk",
						type: ProductType.DRINK,
						size: 1,
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
					},
				],
			});

			await giftAllFridgeProducts(
				users[0].id,
				fridges[0].id,
				users[1].email,
			);

			const products = await prisma.product.findMany({
				where: { fridgeId: fridges[0].id },
			});

			expect(products).to.have.length(2);
			expect(products[0].ownerId).equal(users[1].id);
			expect(products[1].ownerId).equal(users[1].id);
		});

		it("should not transfer products owned by another user", async () => {
			await prisma.product.createMany({
				data: [
					{
						name: "Bread",
						type: ProductType.FOOD,
						size: 2,
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
					},
					{
						name: "Chocolate",
						type: ProductType.FOOD,
						size: 1,
						ownerId: users[1].id,
						fridgeId: fridges[0].id,
					},
				],
			});

			await giftAllFridgeProducts(
				users[0].id,
				fridges[0].id,
				users[2].email,
			);

			const products = await prisma.product.findMany({
				where: { fridgeId: fridges[0].id },
			});

			const giftedProduct = products.find(
				(product) => product.name === "Bread",
			);
			const untouchedProduct = products.find(
				(product) => product.name === "Chocolate",
			);

			expect(giftedProduct.ownerId).equal(users[2].id);
			expect(untouchedProduct.ownerId).equal(users[1].id);
		});

		it("should throw when fridge does not exist", async () => {
			try {
				await giftAllFridgeProducts(
					users[0].id,
					randomUUID(),
					users[1].email,
				);
				expect.fail("Expected error");
			} catch (err: any) {
				expect(err).instanceOf(NotFoundException);
				expect(err.message).equal("There is no fridge with this id.");
			}
		});
	});

	describe("deleteWholeFridge handler", () => {
		it("should delete all products in a fridge owned by the user", async () => {
			await prisma.product.createMany({
				data: [
					{
						name: "Bread",
						type: ProductType.FOOD,
						size: 2,
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
					},
					{
						name: "Milk",
						type: ProductType.DRINK,
						size: 1,
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
					},
				],
			});

			await deleteWholeFridge(users[0].id, fridges[0].id);

			const products = await prisma.product.findMany({
				where: { fridgeId: fridges[0].id },
			});

			expect(products).to.have.length(0);
		});

		it("should not delete products owned by another user", async () => {
			await prisma.product.createMany({
				data: [
					{
						name: "Bread",
						type: ProductType.FOOD,
						size: 2,
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
					},
					{
						name: "Chocolate",
						type: ProductType.FOOD,
						size: 1,
						ownerId: users[1].id,
						fridgeId: fridges[0].id,
					},
				],
			});

			await deleteWholeFridge(users[0].id, fridges[0].id);

			const products = await prisma.product.findMany({
				where: { fridgeId: fridges[0].id },
			});

			expect(products).to.have.length(1);
			expect(products[0].name).equal("Chocolate");
			expect(products[0].ownerId).equal(users[1].id);
		});

		it("should throw when fridge does not exist", async () => {
			try {
				await deleteWholeFridge(users[0].id, randomUUID());

				expect.fail("Expected error");
			} catch (err: any) {
				expect(err).instanceOf(NotFoundException);
				expect(err.message).equal("There is no fridge with that id.");
			}
		});
	});

	describe("getFromLocation handler", () => {
		it("should return products from the given fridge location owned by the user", async () => {
			await prisma.product.createMany({
				data: [
					{
						name: "Milk",
						type: ProductType.DRINK,
						size: 1,
						ownerId: users[0].id,
						fridgeId: fridges[0].id,
					},
					{
						name: "Bread",
						type: ProductType.FOOD,
						size: 2,
						ownerId: users[0].id,
						fridgeId: fridges[1].id,
					},
				],
			});

			const products = await getFromLocation(
				users[0].id,
				fridges[0].location,
			);

			expect(products).to.have.length(1);
			expect(products[0].name).to.equal("Milk");
		});

		it("should not return products from another user's fridge", async () => {
			await prisma.product.createMany({
				data: [
					{
						name: "Milk",
						type: ProductType.DRINK,
						size: 1,
						ownerId: users[1].id,
						fridgeId: fridges[0].id,
					},
				],
			});

			const products = await getFromLocation(
				fridges[0].location,
				users[0].id,
			);

			expect(products).to.have.length(0);
		});

		it("should return an empty array when no products exist in the location", async () => {
			await prisma.product.create({
				data: {
					name: "Eggs",
					type: ProductType.FOOD,
					size: 6,
					ownerId: users[0].id,
					fridgeId: fridges[0].id,
				},
			});

			const products = await getFromLocation(
				"Non Existing Location",
				users[0].id,
			);

			expect(products).to.have.length(0);
		});
	});
});
