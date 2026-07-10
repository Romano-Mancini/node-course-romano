import { expect } from "chai";
import { beforeEach, describe, it } from "mocha";
import bcrypt from "bcryptjs";

import { create } from "../../controllers/fridge/handlers/create.handler";
import { prisma } from "../../lib/prisma";
import { FridgeBody } from "../../contracts/fridge.body";
import { putProduct } from "../../controllers/fridge/handlers/putproduct.handler";
import { ProductType } from "../../contracts/product.body";
import { randomUUID } from "node:crypto";

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

describe("Handler tests", () => {
	describe("Fridge Tests", () => {
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

		it("should put fridge", async () => {
			const fridgeBody: FridgeBody = {
				location: "Arenberg Castle",
				capacity: 15,
			};
			const res = await create(fridgeBody);

			expect(res.location).equal("Arenberg Castle");
			expect(res.capacity).equal(15);
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
});
