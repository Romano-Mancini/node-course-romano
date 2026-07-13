import { Test } from "@nestjs/testing";
import { HttpStatus, ValidationPipe } from "@nestjs/common";
import { expect } from "chai";
import request from "supertest";

import { AppModule } from "../../app.module";
import { prisma } from "../../lib/prisma";
import { ProductType } from "../../contracts/product.body";
import jwt from "jsonwebtoken";

describe("Integration tests", () => {
	describe("User Tests", () => {
		let app: any;

		let user1Token: string;
		let user2Token: string;
		let user1Id: string;
		let user2Id: string;

		let oudeMarktFridgeA: any;
		let groteMarktFridge: any;
		let oudeMarktFridgeB: any;

		let pastaProduct: any;
		let pizzaProduct: any;

		before(async () => {
			const moduleFixture = await Test.createTestingModule({
				imports: [AppModule],
			}).compile();

			app = moduleFixture.createNestApplication();

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

			await prisma.$connect();
			console.log("Database connected successfully");

			await app.init();

			await prisma.product.deleteMany();
			await prisma.recipe.deleteMany();
			await prisma.fridge.deleteMany();
			await prisma.user.deleteMany();
		});

		after(async () => {
			await app.close();
		});

		it("should register user 1 and user 2", async () => {
			await request(app.getHttpServer())
				.post("/api/users")
				.send({
					name: "test",
					email: "test-user+1@panenco.com",
					password: "real secret stuff",
				})
				.expect(HttpStatus.CREATED);

			await request(app.getHttpServer())
				.post("/api/users")
				.send({
					name: "test",
					email: "test-user+2@panenco.com",
					password: "real secret stuff",
				})
				.expect(HttpStatus.CREATED);
		});

		it("should login users and decode payloads", async () => {
			const { body: loginResponse1 } = await request(app.getHttpServer())
				.post("/api/auth/login")
				.send({
					email: "test-user+1@panenco.com",
					password: "real secret stuff",
				})
				.expect(HttpStatus.OK);

			user1Token = loginResponse1.token;
			expect(user1Token).to.be.a("string");

			const { body: loginResponse2 } = await request(app.getHttpServer())
				.post("/api/auth/login")
				.send({
					email: "test-user+2@panenco.com",
					password: "real secret stuff",
				})
				.expect(HttpStatus.OK);

			user2Token = loginResponse2.token;
			expect(user2Token).to.be.a("string");

			const payload1 = jwt.decode(user1Token) as { userId: string };
			const payload2 = jwt.decode(user2Token) as { userId: string };

			user1Id = payload1.userId;
			user2Id = payload2.userId;
		});

		it("should create multiple fridges", async () => {
			const { body: fridgeA } = await request(app.getHttpServer())
				.post("/api/fridges")
				.send({ location: "Oude Markt", capacity: 10 })
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			oudeMarktFridgeA = fridgeA;
			expect(oudeMarktFridgeA.location).equals("Oude Markt");
			expect(oudeMarktFridgeA.capacity).equals(10);

			const { body: fridgeB } = await request(app.getHttpServer())
				.post("/api/fridges")
				.send({ location: "Grote Markt", capacity: 20 })
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			groteMarktFridge = fridgeB;
			expect(groteMarktFridge.location).equals("Grote Markt");
			expect(groteMarktFridge.capacity).equals(20);
		});

		it("should add products to a fridge", async () => {
			const { body: productA } = await request(app.getHttpServer())
				.post(`/api/fridges/${oudeMarktFridgeA.id}/products`)
				.send({ name: "Pasta", type: ProductType.FOOD, size: 2 })
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			pastaProduct = productA;
			expect(pastaProduct.fridgeId).equals(oudeMarktFridgeA.id);
			expect(pastaProduct.ownerId).equals(user1Id);
			expect(pastaProduct.name).equals("Pasta");

			const { body: productB } = await request(app.getHttpServer())
				.post(`/api/fridges/${oudeMarktFridgeA.id}/products`)
				.send({ name: "Pizza", type: ProductType.FOOD, size: 8 })
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			pizzaProduct = productB;
			expect(pizzaProduct.size).equals(8);
		});

		it("should enforce fridge capacity limits", async () => {
			await request(app.getHttpServer())
				.post(`/api/fridges/${oudeMarktFridgeA.id}/products`)
				.send({
					name: "Over capacity Item",
					type: ProductType.FOOD,
					size: 2,
				})
				.set("x-auth", user1Token)
				.expect(HttpStatus.BAD_REQUEST);
		});

		it("should list products by fridge", async () => {
			const { body: isolatedProducts } = await request(
				app.getHttpServer(),
			)
				.get(`/api/fridges/${oudeMarktFridgeA.id}/products`)
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			expect(isolatedProducts).to.have.lengthOf(2);
			expect(isolatedProducts[0].id).equals(pastaProduct.id);
			expect(isolatedProducts[1].id).equals(pizzaProduct.id);
		});

		it("should gift all products in a fridge", async () => {
			const { body: summary } = await request(app.getHttpServer())
				.patch(
					`/api/fridges/${oudeMarktFridgeA.id}/products/gift/test-user+2@panenco.com`,
				)
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			expect(summary.count).to.equal(2);
		});

		it("should verify ownership transfer", async () => {
			const { body: originalGiverStock } = await request(
				app.getHttpServer(),
			)
				.get(`/api/fridges/${oudeMarktFridgeA.id}/products`)
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			expect(originalGiverStock).to.have.lengthOf(0);

			const { body: targetReceiverStock } = await request(
				app.getHttpServer(),
			)
				.get(`/api/fridges/${oudeMarktFridgeA.id}/products`)
				.set("x-auth", user2Token)
				.expect(HttpStatus.OK);

			expect(targetReceiverStock).to.have.lengthOf(2);
			expect(targetReceiverStock[0].id).equals(pastaProduct.id);
			expect(targetReceiverStock[0].ownerId).equals(user2Id);
		});

		it("should clear an entire fridge", async () => {
			await request(app.getHttpServer())
				.delete(`/api/fridges/${oudeMarktFridgeA.id}/products`)
				.set("x-auth", user2Token)
				.expect(HttpStatus.NO_CONTENT);

			const { body: postPurgeStock } = await request(app.getHttpServer())
				.get(`/api/fridges/${oudeMarktFridgeA.id}/products`)
				.set("x-auth", user2Token)
				.expect(HttpStatus.OK);

			expect(postPurgeStock).to.have.lengthOf(0);
		});

		it("should return products of a user across multiple fridges", async () => {
			const { body: product1 } = await request(app.getHttpServer())
				.post(`/api/fridges/${oudeMarktFridgeA.id}/products`)
				.send({ name: "Pasta", type: ProductType.FOOD, size: 2 })
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			pastaProduct = product1;

			const { body: product2 } = await request(app.getHttpServer())
				.post(`/api/fridges/${groteMarktFridge.id}/products`)
				.send({ name: "Pizza", type: ProductType.FOOD, size: 8 })
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			pizzaProduct = product2;

			const { body: userProductsList } = await request(
				app.getHttpServer(),
			)
				.get("/api/products")
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			expect(userProductsList).to.have.lengthOf(2);
			expect(userProductsList[0].name).equals("Pasta");
			expect(userProductsList[1].name).equals("Pizza");
		});

		it("should fetch a specific product by ID", async () => {
			const { body: record } = await request(app.getHttpServer())
				.get(`/api/products/${pastaProduct.id}`)
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			expect(record.fridgeId).equals(oudeMarktFridgeA.id);
			expect(record.name).equals("Pasta");
		});

		it("should gift a single specific product", async () => {
			await request(app.getHttpServer())
				.patch(
					`/api/products/${pastaProduct.id}/gift/test-user+2@panenco.com`,
				)
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			const { body: receiverVerification } = await request(
				app.getHttpServer(),
			)
				.get(`/api/products/${pastaProduct.id}`)
				.set("x-auth", user2Token)
				.expect(HttpStatus.OK);

			expect(receiverVerification.ownerId).equals(user2Id);

			await request(app.getHttpServer())
				.get(`/api/products/${pastaProduct.id}`)
				.set("x-auth", user1Token)
				.expect(HttpStatus.UNAUTHORIZED);
		});

		it("should only authorize deletion from the owner", async () => {
			await request(app.getHttpServer())
				.delete(`/api/products/${pastaProduct.id}`)
				.set("x-auth", user1Token)
				.expect(HttpStatus.UNAUTHORIZED);

			await request(app.getHttpServer())
				.delete(`/api/products/${pastaProduct.id}`)
				.set("x-auth", user2Token)
				.expect(HttpStatus.NO_CONTENT);
		});

		it("should gift all owned products globally", async () => {
			await request(app.getHttpServer())
				.delete(`/api/products/${pizzaProduct.id}`)
				.set("x-auth", user1Token)
				.expect(HttpStatus.NO_CONTENT);

			await request(app.getHttpServer())
				.post(`/api/fridges/${oudeMarktFridgeA.id}/products`)
				.send({ name: "Salad", type: ProductType.FOOD, size: 2 })
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			await request(app.getHttpServer())
				.post(`/api/fridges/${groteMarktFridge.id}/products`)
				.send({ name: "Coca-Cola", type: ProductType.DRINK, size: 2 })
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			await request(app.getHttpServer())
				.patch("/api/products/gift/test-user+2@panenco.com")
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			const { body: totalGiverStock } = await request(app.getHttpServer())
				.get("/api/products")
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			const { body: totalReceiverStock } = await request(
				app.getHttpServer(),
			)
				.get("/api/products")
				.set("x-auth", user2Token)
				.expect(HttpStatus.OK);

			expect(totalGiverStock).to.have.lengthOf(0);
			expect(totalReceiverStock).to.have.lengthOf(2);
		});

		it("should delete all owned products globally", async () => {
			await request(app.getHttpServer())
				.delete("/api/products")
				.set("x-auth", user2Token)
				.expect(HttpStatus.NO_CONTENT);

			await request(app.getHttpServer())
				.delete("/api/products")
				.set("x-auth", user1Token)
				.expect(HttpStatus.NO_CONTENT);
		});

		it("should filter products by location", async () => {
			await request(app.getHttpServer())
				.post(`/api/fridges/${oudeMarktFridgeA.id}/products`)
				.send({ name: "Pasta", type: ProductType.FOOD, size: 2 })
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			const { body: fridgeC } = await request(app.getHttpServer())
				.post("/api/fridges")
				.send({ location: "Oude Markt", capacity: 10 })
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			oudeMarktFridgeB = fridgeC;

			await request(app.getHttpServer())
				.post(`/api/fridges/${oudeMarktFridgeB.id}/products`)
				.send({ name: "Sushi", type: ProductType.FOOD, size: 2 })
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			const targetLocationParam = encodeURIComponent("Oude Markt");
			const { body: locationAggregatedProducts } = await request(
				app.getHttpServer(),
			)
				.get(`/api/products/location/${targetLocationParam}`)
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			expect(locationAggregatedProducts).to.have.lengthOf(2);
			expect(locationAggregatedProducts[0].name).to.equal("Pasta");
			expect(locationAggregatedProducts[1].name).to.equal("Sushi");
		});

		it("should create a new recipe", async () => {
			const { body: recipe } = await request(app.getHttpServer())
				.post("/api/recipes")
				.send({
					name: "Tonnarelli cacio e pepe",
					description:
						"Boil pasta and then put cheese and pepper on top.",
					ingredients: ["Pasta", "Cheese", "Pepper"],
				})
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			expect(recipe.name).to.equal("Tonnarelli cacio e pepe");
			expect(recipe.ownerId).to.equal(user1Id);
		});

		it("should list all user recipes", async () => {
			const { body: library } = await request(app.getHttpServer())
				.get("/api/recipes")
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			expect(library).to.have.lengthOf(1);
			expect(library[0].name).to.equal("Tonnarelli cacio e pepe");
		});

		it("should delete a recipe", async () => {
			const targetRecipeParam = encodeURIComponent(
				"Tonnarelli cacio e pepe",
			);
			await request(app.getHttpServer())
				.delete(`/api/recipes/${targetRecipeParam}`)
				.set("x-auth", user1Token)
				.expect(HttpStatus.NO_CONTENT);

			const { body: verificationList } = await request(
				app.getHttpServer(),
			)
				.get("/api/recipes")
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			expect(verificationList).to.have.lengthOf(0);
		});

		it("should update an existing recipe", async () => {
			const targetRecipeParam = encodeURIComponent(
				"Tonnarelli cacio e pepe",
			);

			await request(app.getHttpServer())
				.post("/api/recipes")
				.send({
					name: "Tonnarelli cacio e pepe",
					description:
						"Boil pasta and then put cheese and pepper on top.",
					ingredients: ["Pasta", "Cheese", "Pepper"],
				})
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			await request(app.getHttpServer())
				.patch(`/api/recipes/${targetRecipeParam}`)
				.send({
					description:
						"Boil A LOT OF pasta and then put cheese and pepper on top.",
					ingredients: ["Pasta", "Cheese", "Pepper", "Pecorino"],
				})
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			const { body: library } = await request(app.getHttpServer())
				.get("/api/recipes")
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			expect(library[0].description).to.equal(
				"Boil A LOT OF pasta and then put cheese and pepper on top.",
			);
			expect(library[0].ingredients).to.deep.equal([
				"Pasta",
				"Cheese",
				"Pepper",
				"Pecorino",
			]);
		});

		it("should calculate missing ingredients based on stock", async () => {
			await request(app.getHttpServer())
				.post("/api/recipes")
				.send({
					name: "Pasta Pesto",
					description: "Boil pasta and then put pesto.",
					ingredients: ["Pasta", "Pesto"],
				})
				.set("x-auth", user1Token)
				.expect(HttpStatus.CREATED);

			const targetRecipeParam = encodeURIComponent("Pasta Pesto");
			const { body: targetRecipe } = await request(app.getHttpServer())
				.get(`/api/recipes/${targetRecipeParam}`)
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			expect(targetRecipe.name).to.equal("Pasta Pesto");

			const { body: missingItemsList } = await request(
				app.getHttpServer(),
			)
				.get(`/api/recipes/missingIngredients/${targetRecipeParam}`)
				.set("x-auth", user1Token)
				.expect(HttpStatus.OK);

			expect(missingItemsList).to.have.lengthOf(1);
			expect(missingItemsList[0]).to.equal("Pesto");
		});
	});
});
