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
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { deleteProduct } from "../../controllers/fridge/handlers/delete.handler";
import { getProduct } from "../../controllers/fridge/handlers/get.handler";
import { getAllFridgeProducts } from "../../controllers/fridge/handlers/getallfridge.handler";
import { giftAllFridgeProducts } from "../../controllers/fridge/handlers/giftallfridge.handler";
import { deleteWholeFridge } from "../../controllers/fridge/handlers/deletewholefridge.handler";
import { getAllProducts } from "../../controllers/fridge/handlers/getallproducts.handler";
import { giftAllProducts } from "../../controllers/fridge/handlers/giftallproducts.handler";
import { deleteAllProducts } from "../../controllers/fridge/handlers/deleteall.handler";
import { getFromLocation } from "../../controllers/fridge/handlers/getfromlocation.handler";

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
	describe("create handler", () => {
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.recipe.deleteMany();
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
							surname: fixture.surname,
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
			await prisma.recipe.deleteMany();
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
			await prisma.recipe.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) => {
					return prisma.user.create({
						data: {
							name: fixture.name,
							surname: fixture.surname,
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
			await prisma.recipe.deleteMany();
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

	describe("getProduct handler", () => {
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.recipe.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) => {
					return prisma.user.create({
						data: {
							name: fixture.name,
							surname: fixture.surname,
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

	describe("getAllFridgeProducts handler", () => {
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.recipe.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) => {
					return prisma.user.create({
						data: {
							name: fixture.name,
							surname: fixture.surname,
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
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.recipe.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) => {
					return prisma.user.create({
						data: {
							name: fixture.name,
							surname: fixture.surname,
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
				users[1].id,
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
				users[2].id,
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
					users[1].id,
				);
				expect.fail("Expected error");
			} catch (err: any) {
				expect(err).instanceOf(NotFoundException);
				expect(err.message).equal("There is no fridge with this id.");
			}
		});
	});

	describe("deleteWholeFridge handler", () => {
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.recipe.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) => {
					return prisma.user.create({
						data: {
							name: fixture.name,
							surname: fixture.surname,
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

	describe("getAllProducts handler", () => {
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.recipe.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) =>
					prisma.user.create({
						data: {
							name: fixture.name,
							surname: fixture.surname,
							email: fixture.email,
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
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.recipe.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) =>
					prisma.user.create({
						data: {
							name: fixture.name,
							surname: fixture.surname,
							email: fixture.email,
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

			await giftAllProducts(users[0].id, users[1].id);

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

			await giftAllProducts(users[0].id, users[1].id);

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
			await giftAllProducts(users[0].id, users[1].id);

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
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.recipe.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) =>
					prisma.user.create({
						data: {
							name: fixture.name,
							surname: fixture.surname,
							email: fixture.email,
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
	describe("getFromLocation handler", () => {
		let users: any[];
		let fridges: any[];

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.recipe.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();

			users = await Promise.all(
				userFixtures.map(async (fixture) =>
					prisma.user.create({
						data: {
							name: fixture.name,
							surname: fixture.surname,
							email: fixture.email,
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
				fridges[0].location,
				users[0].id,
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
