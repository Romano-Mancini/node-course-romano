import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { expect } from "chai";
import request from "supertest";

import { AppModule } from "../../app.module";
import { prisma } from "../../lib/prisma";
import { ProductType } from "../../contracts/product.body";
import jwt from "jsonwebtoken";

describe("Integration tests", () => {
	describe("User Tests", () => {
		let app: any;

		before(async () => {
			const moduleFixture = await Test.createTestingModule({
				imports: [AppModule],
			}).compile();

			app = moduleFixture.createNestApplication();

			// Apply the same configuration as in main.ts
			app.useGlobalPipes(
				new ValidationPipe({
					whitelist: true,
					forbidNonWhitelisted: true,
					transform: true,
					transformOptions: { exposeUnsetFields: false },
				}),
			);

			app.enableCors({
				origin: "*",
				credentials: true,
				exposedHeaders: ["x-auth"],
			});

			app.setGlobalPrefix("api");

			// Connect to database
			await prisma.$connect();
			console.log("Database connected successfully");

			await app.init();
		});

		beforeEach(async () => {
			await prisma.product.deleteMany();
			await prisma.recipe.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();
		});

		after(async () => {
			await app.close();
		});

		it("should CRUD products/fridges/recipes with authentication", async () => {
			// Successfully create new user (public endpoint)
			const { body: createResponse } = await request(app.getHttpServer())
				.post(`/api/users`)
				.send({
					name: "test",
					email: "test-user+1@panenco.com",
					password: "real secret stuff",
				})
				.expect(201);

			// Login to get JWT token
			const { body: loginResponse } = await request(app.getHttpServer())
				.post(`/api/auth/login`)
				.send({
					email: "test-user+1@panenco.com",
					password: "real secret stuff",
				})
				.expect(200);

			const token = loginResponse.token;
			expect(token).to.be.a("string");

			const payload = jwt.decode(token) as {
				userId: string;
				email: string;
			};

			// Create a fridge
			const { body: fridge } = await request(app.getHttpServer())
				.post(`/api/fridges`)
				.send({
					location: "Oude Markt",
					capacity: 10,
				})
				.set("x-auth", token)
				.expect(201);

			expect(fridge.location).equals("Oude Markt");
			expect(fridge.capacity).equals(10);

			// Put a product in a fridge
			const { body: product } = await request(app.getHttpServer())
				.post(`/api/fridges/${fridge.id}/products`)
				.send({
					name: "Pasta",
					type: ProductType.FOOD,
					size: 2,
				})
				.set("x-auth", token)
				.expect(201);

			expect(product.fridgeId).equals(fridge.id);
			expect(product.ownerId).equals(payload.userId);
			expect(product.name).equals("Pasta");
			expect(product.type).equals(ProductType.FOOD);
			expect(product.size).equals(2);
			expect(product.createdAt).equals(product.updatedAt);

			// Put another product in a fridge
			const { body: product2 } = await request(app.getHttpServer())
				.post(`/api/fridges/${fridge.id}/products`)
				.send({
					name: "Pizza",
					type: ProductType.FOOD,
					size: 8,
				})
				.set("x-auth", token)
				.expect(201);

			expect(product2.fridgeId).equals(fridge.id);
			expect(product2.ownerId).equals(payload.userId);
			expect(product2.name).equals("Pizza");
			expect(product2.type).equals(ProductType.FOOD);
			expect(product2.size).equals(8);
			expect(product2.createdAt).equals(product2.updatedAt);

			// Put a product in a fridge that's full
			const { body: product3 } = await request(app.getHttpServer())
				.post(`/api/fridges/${fridge.id}/products`)
				.send({
					name: "Pasta",
					type: ProductType.FOOD,
					size: 2,
				})
				.set("x-auth", token)
				.expect(400);

			// List all the products of the user in a specific fridge
			const { body: obtainedProducts } = await request(
				app.getHttpServer(),
			)
				.get(`/api/fridges/${fridge.id}/products`)
				.set("x-auth", token)
				.expect(200);

			expect(obtainedProducts).to.have.lengthOf(2);
			expect(obtainedProducts[0].id).equals(product.id);
			expect(obtainedProducts[1].id).equals(product2.id);
		});
	});
});
