import { expect } from "chai";
import { beforeEach, describe, it } from "mocha";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";

import { prisma } from "../../lib/prisma";
import { putProduct } from "../../controllers/fridge/handlers/putproduct.handler";
import { ProductType } from "../../contracts/product.body";
import { giftProduct } from "../../controllers/fridge/handlers/gift.handler";
import { deleteProduct } from "../../controllers/fridge/handlers/delete.handler";
import { getProduct } from "../../controllers/fridge/handlers/get.handler";
import { getAllProducts } from "../../controllers/fridge/handlers/getallproducts.handler";
import { giftAllProducts } from "../../controllers/fridge/handlers/giftallproducts.handler";
import { deleteAllProducts } from "../../controllers/fridge/handlers/deleteall.handler";

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

describe("Product handlers", () => {
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

	describe("putProduct handler", () => {
		it("should create a product", async () => {
			const res = await putProduct(users[0].id, fridges[0].id, {
				name: "Bread",
				type: ProductType.FOOD,
				size: 2,
			});

			expect(res.name).equal("Bread");
			expect(res.size).equal(2);
		});

		it("should throw when fridge does not exist", async () => {
			try {
				await putProduct(users[0].id, randomUUID(), {
					name: "Pasta",
					type: ProductType.FOOD,
					size: 3,
				});

				expect.fail("Expected an error");
			} catch (err: any) {
				expect(err.message).equal("Fridge not found.");
			}
		});

		it("should allow filling fridge exactly to capacity", async () => {
			await prisma.product.create({
				data: {
					name: "Eggs",
					type: ProductType.FOOD,
					size: 7,
					ownerId: users[0].id,
					fridgeId: fridges[0].id,
				},
			});

			const res = await putProduct(users[0].id, fridges[0].id, {
				name: "Water",
				type: ProductType.DRINK,
				size: 3,
			});

			expect(res.size).equal(3);
		});

		it("should throw when capacity would be exceeded", async () => {
			await prisma.product.create({
				data: {
					name: "Eggs",
					type: ProductType.FOOD,
					size: 7,
					ownerId: users[0].id,
					fridgeId: fridges[0].id,
				},
			});

			try {
				await putProduct(users[0].id, fridges[0].id, {
					name: "Water",
					type: ProductType.DRINK,
					size: 4,
				});

				expect.fail("Expected error");
			} catch (err: any) {
				expect(err.message).equal(
					"This request would exceed the fridge's capacity.",
				);
			}
		});
	});

	describe("giftProduct handler", () => {
		it("should update the owner of a product", async () => {
			const product = await prisma.product.create({
				data: {
					name: "Chocolate",
					type: ProductType.FOOD,
					size: 1,
					ownerId: users[0].id,
					fridgeId: fridges[0].id,
				},
			});

			const res = await giftProduct(
				users[0].id,
				product.id,
				users[1].email,
			);

			expect(res.ownerId).equal(users[1].id);
		});

		it("should throw when gifting from a non-existing user", async () => {
			const product = await prisma.product.create({
				data: {
					name: "Chocolate",
					type: ProductType.FOOD,
					size: 1,
					ownerId: users[0].id,
					fridgeId: fridges[0].id,
				},
			});

			try {
				await giftProduct(randomUUID(), product.id, users[1].id);

				expect.fail("Expected error");
			} catch (err: any) {
				expect(err).instanceOf(NotFoundException);
				expect(err.message).equal("Invalid user id.");
			}
		});

		it("should throw when gifting a non-existing product", async () => {
			try {
				await giftProduct(users[0].id, randomUUID(), users[1].id);

				expect.fail("Expected error");
			} catch (err: any) {
				expect(err).instanceOf(NotFoundException);
				expect(err.message).equal("Invalid product id.");
			}
		});

		it("should throw when user is not the owner", async () => {
			const product = await prisma.product.create({
				data: {
					name: "Milk",
					type: ProductType.DRINK,
					size: 1,
					ownerId: users[0].id,
					fridgeId: fridges[0].id,
				},
			});

			try {
				await giftProduct(users[1].id, product.id, users[0].id);

				expect.fail("Expected error");
			} catch (err: any) {
				expect(err).instanceOf(NotFoundException);
				expect(err.message).equal(
					"You are not the owner of the product.",
				);
			}
		});
	});

	describe("deleteProduct handler", () => {
		it("should delete a user's product", async () => {
			const product = await prisma.product.create({
				data: {
					name: "Milk",
					type: ProductType.DRINK,
					size: 1,
					ownerId: users[0].id,
					fridgeId: fridges[0].id,
				},
			});

			await deleteProduct(users[0].id, product.id);

			const res = await prisma.product.findUnique({
				where: { id: product.id },
			});

			expect(res).to.be.null;
		});

		it("should throw if product does not exist", async () => {
			try {
				await deleteProduct(users[0].id, "non-existing-product-id");

				expect.fail("Expected error");
			} catch (err: any) {
				expect(err).instanceOf(NotFoundException);
				expect(err.message).equal("Couldn't find the product.");
			}
		});

		it("should throw if user is not the owner", async () => {
			const product = await prisma.product.create({
				data: {
					name: "Milk",
					type: ProductType.DRINK,
					size: 1,
					ownerId: users[0].id,
					fridgeId: fridges[0].id,
				},
			});

			try {
				await deleteProduct(users[1].id, product.id);

				expect.fail("Expected error");
			} catch (err: any) {
				expect(err).instanceOf(UnauthorizedException);
				expect(err.message).equal(
					"You are not the owner of the product.",
				);
			}
		});

		it("should return the deleted product", async () => {
			const product = await prisma.product.create({
				data: {
					name: "Bread",
					type: ProductType.FOOD,
					size: 1,
					ownerId: users[0].id,
					fridgeId: fridges[0].id,
				},
			});

			const deleted = await deleteProduct(users[0].id, product.id);

			expect(deleted.name).equal("Bread");
			expect(deleted.ownerId).equal(users[0].id);
		});
	});

	describe("getProduct handler", () => {
		it("should return a user's own product", async () => {
			const product = await prisma.product.create({
				data: {
					name: "Bread",
					type: ProductType.FOOD,
					size: 2,
					ownerId: users[0].id,
					fridgeId: fridges[0].id,
				},
			});

			const res = await getProduct(users[0].id, product.id);

			expect(res.id).equal(product.id);
			expect(res.name).equal("Bread");
			expect(res.ownerId).equal(users[0].id);
		});

		it("should throw when product does not exist", async () => {
			try {
				await getProduct(users[0].id, randomUUID());
				expect.fail("Expected error");
			} catch (err: any) {
				expect(err).instanceOf(NotFoundException);
				expect(err.message).equal("There is no product with this id.");
			}
		});

		it("should throw when user is not the owner", async () => {
			const product = await prisma.product.create({
				data: {
					name: "Milk",
					type: ProductType.DRINK,
					size: 1,
					ownerId: users[0].id,
					fridgeId: fridges[0].id,
				},
			});

			try {
				await getProduct(users[1].id, product.id);
				expect.fail("Expected error");
			} catch (err: any) {
				expect(err).instanceOf(UnauthorizedException);
				expect(err.message).equal("The product is not yours.");
			}
		});

		it("should throw when trying to retrieve a deleted product", async () => {
			const product = await prisma.product.create({
				data: {
					name: "Eggs",
					type: ProductType.FOOD,
					size: 6,
					ownerId: users[0].id,
					fridgeId: fridges[0].id,
				},
			});

			await prisma.product.delete({
				where: {
					id: product.id,
				},
			});

			try {
				await getProduct(users[0].id, product.id);
				expect.fail("Expected error");
			} catch (err: any) {
				expect(err).instanceOf(NotFoundException);
				expect(err.message).equal("There is no product with this id.");
			}
		});
	});

	describe("getAllProducts handler", () => {
		it("should return all products owned by the user", async () => {
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
						fridgeId: fridges[1].id,
					},
				],
			});

			const res = await getAllProducts(users[0].id);

			expect(res).to.have.length(2);
			expect(res.every((p) => p.ownerId === users[0].id)).to.be.true;
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

			const res = await getAllProducts(users[0].id);

			expect(res).to.have.length(1);
			expect(res[0].name).equal("Bread");
			expect(res[0].ownerId).equal(users[0].id);
		});

		it("should return an empty array when the user owns no products", async () => {
			const res = await getAllProducts(users[0].id);

			expect(res).to.have.length(0);
		});
	});

	describe("giftAllProducts handler", () => {
		it("should transfer all products from the owner to the recipient", async () => {
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
						fridgeId: fridges[1].id,
					},
				],
			});

			await giftAllProducts(users[0].id, users[1].email);

			const senderProducts = await prisma.product.findMany({
				where: { ownerId: users[0].id },
			});
			const recipientProducts = await prisma.product.findMany({
				where: { ownerId: users[1].id },
			});

			expect(senderProducts).to.have.length(0);
			expect(recipientProducts).to.have.length(2);
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
						ownerId: users[2].id,
						fridgeId: fridges[1].id,
					},
				],
			});

			await giftAllProducts(users[0].id, users[1].email);

			const recipientProducts = await prisma.product.findMany({
				where: { ownerId: users[1].id },
			});
			const otherUserProducts = await prisma.product.findMany({
				where: { ownerId: users[2].id },
			});

			expect(recipientProducts).to.have.length(1);
			expect(recipientProducts[0].name).to.equal("Bread");
			expect(otherUserProducts).to.have.length(1);
			expect(otherUserProducts[0].name).to.equal("Chocolate");
		});

		it("should do nothing when the owner has no products", async () => {
			await giftAllProducts(users[0].id, users[1].email);

			const senderProducts = await prisma.product.findMany({
				where: { ownerId: users[0].id },
			});
			const recipientProducts = await prisma.product.findMany({
				where: { ownerId: users[1].id },
			});

			expect(senderProducts).to.have.length(0);
			expect(recipientProducts).to.have.length(0);
		});
	});

	describe("deleteAllProducts handler", () => {
		it("should delete all products owned by the user", async () => {
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
						fridgeId: fridges[1].id,
					},
				],
			});

			await deleteAllProducts(users[0].id);

			const products = await prisma.product.findMany({
				where: { ownerId: users[0].id },
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
						fridgeId: fridges[1].id,
					},
				],
			});

			await deleteAllProducts(users[0].id);

			const userProducts = await prisma.product.findMany({
				where: { ownerId: users[0].id },
			});
			const otherUserProducts = await prisma.product.findMany({
				where: { ownerId: users[1].id },
			});

			expect(userProducts).to.have.length(0);
			expect(otherUserProducts).to.have.length(1);
		});

		it("should do nothing when the user has no products", async () => {
			await deleteAllProducts(users[0].id);

			const products = await prisma.product.findMany({
				where: { ownerId: users[0].id },
			});

			expect(products).to.have.length(0);
		});
	});
});
