import { expect } from "chai";
import { beforeEach, describe, it } from "mocha";
import bcrypt from "bcryptjs";

import { create } from "../../controllers/fridge/handlers/create.handler";
import { prisma } from "../../lib/prisma";
import { FridgeBody } from "../../contracts/fridge.body";
import { putProduct } from "../../controllers/fridge/handlers/putproduct.handler";
import { ProductType } from "../../contracts/product.body";
import { randomUUID } from "node:crypto";
import { giftProduct } from "../../controllers/fridge/handlers/gift.handler";
import { NotFoundException } from "@nestjs/common";
import { deleteProduct } from "../../controllers/fridge/handlers/delete.handler";

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
		email: "test-user+1@panenco.com",
		password: "password1",
	},
	{
		name: "test2",
		email: "test-user+2@panenco.com",
		password: "password2",
	},
];

describe("Fridge handlers", () => {
	describe("create handler", () => {
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) => {
					const hashedPassword = await bcrypt.hash(
						fixture.password,
						10,
					);

					return prisma.user.create({
						data: {
							name: fixture.name,
							email: fixture.email,
							password: hashedPassword,
						},
					});
				}),
			);
		});

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

	describe("putProduct handler", () => {
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) => {
					const hashedPassword = await bcrypt.hash(
						fixture.password,
						10,
					);

					return prisma.user.create({
						data: {
							name: fixture.name,
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
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) => {
					return prisma.user.create({
						data: {
							name: fixture.name,
							email: fixture.email,
							password: await bcrypt.hash(fixture.password, 10),
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

			const res = await giftProduct(users[0].id, product.id, users[1].id);

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
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) =>
					prisma.user.create({
						data: {
							...fixture,
							password: await bcrypt.hash(fixture.password, 10),
						},
					}),
				),
			);

			fridges = await Promise.all(
				fridgeFixtures.map((fixture) =>
					prisma.fridge.create({
						data: fixture,
					}),
				),
			);
		});

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
				expect(err).instanceOf(NotFoundException);
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
});
