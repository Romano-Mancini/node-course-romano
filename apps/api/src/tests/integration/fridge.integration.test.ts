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
			// Successfully create first user
			const { body: createResponse } = await request(app.getHttpServer())
				.post(`/api/users`)
				.send({
					name: "test",
					email: "test-user+1@panenco.com",
					password: "real secret stuff",
				})
				.expect(201);

			// Successfully create second user
			const { body: createResponse2 } = await request(app.getHttpServer())
				.post(`/api/users`)
				.send({
					name: "test",
					email: "test-user+2@panenco.com",
					password: "real secret stuff",
				})
				.expect(201);

			// Login to get JWT token of the first user
			const { body: loginResponse } = await request(app.getHttpServer())
				.post(`/api/auth/login`)
				.send({
					email: "test-user+1@panenco.com",
					password: "real secret stuff",
				})
				.expect(200);

			const token1 = loginResponse.token;
			expect(token1).to.be.a("string");

			// Login to get JWT token of the second user
			const { body: loginResponse2 } = await request(app.getHttpServer())
				.post(`/api/auth/login`)
				.send({
					email: "test-user+2@panenco.com",
					password: "real secret stuff",
				})
				.expect(200);

			const token2 = loginResponse2.token;
			expect(token2).to.be.a("string");

			const payload1 = jwt.decode(token1) as {
				userId: string;
			};

			const payload2 = jwt.decode(token2) as {
				userId: string;
			};

			// Create two fridges
			const { body: fridge } = await request(app.getHttpServer())
				.post(`/api/fridges`)
				.send({
					location: "Oude Markt",
					capacity: 10,
				})
				.set("x-auth", token1)
				.expect(201);

			expect(fridge.location).equals("Oude Markt");
			expect(fridge.capacity).equals(10);

			// Create two fridges
			const { body: fridge2 } = await request(app.getHttpServer())
				.post(`/api/fridges`)
				.send({
					location: "Grote Markt",
					capacity: 20,
				})
				.set("x-auth", token1)
				.expect(201);

			expect(fridge2.location).equals("Grote Markt");
			expect(fridge2.capacity).equals(20);

			// Put a product in a fridge
			const { body: product } = await request(app.getHttpServer())
				.post(`/api/fridges/${fridge.id}/products`)
				.send({
					name: "Pasta",
					type: ProductType.FOOD,
					size: 2,
				})
				.set("x-auth", token1)
				.expect(201);

			expect(product.fridgeId).equals(fridge.id);
			expect(product.ownerId).equals(payload1.userId);
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
				.set("x-auth", token1)
				.expect(201);

			expect(product2.fridgeId).equals(fridge.id);
			expect(product2.ownerId).equals(payload1.userId);
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
				.set("x-auth", token1)
				.expect(400);

			// List all the products of the user in a specific fridge
			const { body: obtainedProducts } = await request(
				app.getHttpServer(),
			)
				.get(`/api/fridges/${fridge.id}/products`)
				.set("x-auth", token1)
				.expect(200);

			expect(obtainedProducts).to.have.lengthOf(2);
			expect(obtainedProducts[0].id).equals(product.id);
			expect(obtainedProducts[1].id).equals(product2.id);

			// Gift all products from one fridge to another user
			const { body: giftedProducts } = await request(app.getHttpServer())
				.patch(
					`/api/fridges/${fridge.id}/products/gift/test-user+2@panenco.com`,
				)
				.set("x-auth", token1)
				.expect(200);
			expect(giftedProducts.count).to.equal(2);

			// original user should have no products anymore
			const { body: obtainedProducts1 } = await request(
				app.getHttpServer(),
			)
				.get(`/api/fridges/${fridge.id}/products`)
				.set("x-auth", token1)
				.expect(200);

			expect(obtainedProducts1).to.have.lengthOf(0);

			// receiver user should have all products anymore
			const { body: obtainedProducts2 } = await request(
				app.getHttpServer(),
			)
				.get(`/api/fridges/${fridge.id}/products`)
				.set("x-auth", token2)
				.expect(200);

			expect(obtainedProducts2).to.have.lengthOf(2);
			expect(obtainedProducts2[0].id).equals(product.id);
			expect(obtainedProducts2[1].id).equals(product2.id);
			expect(obtainedProducts2[0].ownerId).equals(payload2.userId);
			expect(obtainedProducts2[1].ownerId).equals(payload2.userId);

			const { body: deletedProducts } = await request(app.getHttpServer())
				.delete(`/api/fridges/${fridge.id}/products`)
				.set("x-auth", token2)
				.expect(204);

			// receiver user should have no products anymore
			const { body: obtainedProducts3 } = await request(
				app.getHttpServer(),
			)
				.get(`/api/fridges/${fridge.id}/products`)
				.set("x-auth", token2)
				.expect(200);

			expect(obtainedProducts3).to.have.lengthOf(0);

			// put two products in two different fridges, then retrieve them all
			const { body: product4 } = await request(app.getHttpServer())
				.post(`/api/fridges/${fridge.id}/products`)
				.send({
					name: "Pasta",
					type: ProductType.FOOD,
					size: 2,
				})
				.set("x-auth", token1)
				.expect(201);

			expect(product4.fridgeId).equals(fridge.id);
			expect(product4.ownerId).equals(payload1.userId);
			expect(product4.name).equals("Pasta");
			expect(product4.type).equals(ProductType.FOOD);
			expect(product4.size).equals(2);
			expect(product4.createdAt).equals(product4.updatedAt);
			const { body: product5 } = await request(app.getHttpServer())
				.post(`/api/fridges/${fridge2.id}/products`)
				.send({
					name: "Pizza",
					type: ProductType.FOOD,
					size: 8,
				})
				.set("x-auth", token1)
				.expect(201);

			expect(product5.fridgeId).equals(fridge2.id);
			expect(product5.ownerId).equals(payload1.userId);
			expect(product5.name).equals("Pizza");
			expect(product5.type).equals(ProductType.FOOD);
			expect(product5.size).equals(8);
			expect(product5.createdAt).equals(product5.updatedAt);

			const { body: obtainedProducts4 } = await request(
				app.getHttpServer(),
			)
				.get(`/api/products`)
				.set("x-auth", token1)
				.expect(200);

			expect(obtainedProducts4).to.have.lengthOf(2);
			expect(obtainedProducts4[0].name).equals("Pasta");
			expect(obtainedProducts4[1].name).equals("Pizza");

			// retrieve specific product
			const { body: specificProduct } = await request(app.getHttpServer())
				.get(`/api/products/${obtainedProducts4[0].id}`)
				.set("x-auth", token1)
				.expect(200);

			expect(specificProduct.fridgeId).equals(fridge.id);
			expect(specificProduct.ownerId).equals(payload1.userId);
			expect(specificProduct.name).equals("Pasta");
			expect(specificProduct.type).equals(ProductType.FOOD);
			expect(specificProduct.size).equals(2);
			expect(specificProduct.createdAt).equals(specificProduct.updatedAt);

			// gift specific product to another user, check that it works
			const { body: giftedProduct } = await request(app.getHttpServer())
				.patch(
					`/api/products/${obtainedProducts4[0].id}/gift/test-user+2@panenco.com`,
				)
				.set("x-auth", token1)
				.expect(200);

			expect(giftedProduct.id).to.equal(obtainedProducts4[0].id);

			const { body: giftedProductAfter } = await request(
				app.getHttpServer(),
			)
				.get(`/api/products/${obtainedProducts4[0].id}`)
				.set("x-auth", token2)
				.expect(200);

			expect(giftedProductAfter.ownerId).equals(payload2.userId);

			await request(app.getHttpServer())
				.get(`/api/products/${obtainedProducts4[0].id}`)
				.set("x-auth", token1)
				.expect(401);

			// delete specific product if authorized
			await request(app.getHttpServer())
				.delete(`/api/products/${giftedProductAfter.id}`)
				.set("x-auth", token1)
				.expect(401);

			await request(app.getHttpServer())
				.delete(`/api/products/${giftedProductAfter.id}`)
				.set("x-auth", token2)
				.expect(204);

			// create products in different fridges, then gift them all to another user
			await request(app.getHttpServer())
				.delete(`/api/products/${product5.id}`)
				.set("x-auth", token1)
				.expect(204);

			await request(app.getHttpServer())
				.post(`/api/fridges/${fridge.id}/products`)
				.send({
					name: "Salad",
					type: ProductType.FOOD,
					size: 2,
				})
				.set("x-auth", token1)
				.expect(201);
			await request(app.getHttpServer())
				.post(`/api/fridges/${fridge2.id}/products`)
				.send({
					name: "Coca-Cola",
					type: ProductType.DRINK,
					size: 2,
				})
				.set("x-auth", token1)
				.expect(201);

			await request(app.getHttpServer())
				.patch("/api/products/gift/test-user+2@panenco.com")
				.set("x-auth", token1)
				.expect(200);

			const { body: allProductsGiver } = await request(
				app.getHttpServer(),
			)
				.get(`/api/products`)
				.set("x-auth", token1)
				.expect(200);

			const { body: allProductsReceiver } = await request(
				app.getHttpServer(),
			)
				.get(`/api/products`)
				.set("x-auth", token2)
				.expect(200);

			expect(allProductsGiver).to.have.lengthOf(0);
			expect(allProductsReceiver).to.have.lengthOf(2);

			// delete all products of a user
			await request(app.getHttpServer())
				.delete(`/api/products`)
				.set("x-auth", token2)
				.expect(204);

			await request(app.getHttpServer())
				.delete(`/api/products`)
				.set("x-auth", token1)
				.expect(204);

			// get all products in location
			await request(app.getHttpServer())
				.post(`/api/fridges/${fridge.id}/products`)
				.send({
					name: "Pasta",
					type: ProductType.FOOD,
					size: 2,
				})
				.set("x-auth", token1)
				.expect(201);

			const { body: fridge3 } = await request(app.getHttpServer())
				.post(`/api/fridges`)
				.send({
					location: "Oude Markt",
					capacity: 10,
				})
				.set("x-auth", token1)
				.expect(201);

			await request(app.getHttpServer())
				.post(`/api/fridges/${fridge3.id}/products`)
				.send({
					name: "Sushi",
					type: ProductType.FOOD,
					size: 2,
				})
				.set("x-auth", token1)
				.expect(201);

			const { body: productsInOude } = await request(app.getHttpServer())
				.get(
					`/api/products/?location=${encodeURIComponent("Oude Markt")}`,
				)
				.set("x-auth", token1)
				.expect(200);

			expect(productsInOude).that.have.lengthOf(2);
			expect(productsInOude[0].name).to.be.equal("Pasta");
			expect(productsInOude[1].name).to.be.equal("Sushi");

			// create a recipe
			const { body: recipe } = await request(app.getHttpServer())
				.post(`/api/recipes`)
				.send({
					name: "Tonnarelli cacio e pepe",
					description:
						"Boil pasta and then put cheese and pepper on top.",
					ingredients: ["Pasta", "Cheese", "Pepper"],
				})
				.set("x-auth", token1)
				.expect(201);

			expect(recipe.name).to.be.equal("Tonnarelli cacio e pepe");
			expect(recipe.description).to.be.equal(
				"Boil pasta and then put cheese and pepper on top.",
			);
			expect(recipe.ingredients).to.be.deep.equal([
				"Pasta",
				"Cheese",
				"Pepper",
			]);
			expect(recipe.ownerId).to.be.equal(payload1.userId);

			// get all recipes
			const { body: allRecipes } = await request(app.getHttpServer())
				.get(`/api/recipes`)
				.set("x-auth", token1)
				.expect(HttpStatus.OK);

			expect(allRecipes).to.have.lengthOf(1);
			expect(allRecipes[0].name).to.be.equal("Tonnarelli cacio e pepe");
			expect(allRecipes[0].description).to.be.equal(
				"Boil pasta and then put cheese and pepper on top.",
			);
			expect(allRecipes[0].ingredients).to.be.deep.equal([
				"Pasta",
				"Cheese",
				"Pepper",
			]);
			expect(allRecipes[0].ownerId).to.be.equal(payload1.userId);

			// delete a recipe
			await request(app.getHttpServer())
				.delete(
					`/api/recipes/${encodeURIComponent("Tonnarelli cacio e pepe")}`,
				)
				.set("x-auth", token1)
				.expect(HttpStatus.NO_CONTENT);

			const { body: remainingRecipes } = await request(
				app.getHttpServer(),
			)
				.get(`/api/recipes`)
				.set("x-auth", token1)
				.expect(HttpStatus.OK);

			expect(remainingRecipes).to.have.lengthOf(0);

			// update a recipe
			await request(app.getHttpServer())
				.post(`/api/recipes`)
				.send({
					name: "Tonnarelli cacio e pepe",
					description:
						"Boil pasta and then put cheese and pepper on top.",
					ingredients: ["Pasta", "Cheese", "Pepper"],
				})
				.set("x-auth", token1)
				.expect(201);

			await request(app.getHttpServer())
				.patch(
					`/api/recipes/${encodeURIComponent("Tonnarelli cacio e pepe")}`,
				)
				.send({
					description:
						"Boil A LOT OF pasta and then put cheese and pepper on top.",
					ingredients: ["Pasta", "Cheese", "Pepper", "Pecorino"],
				})
				.set("x-auth", token1)
				.expect(200);

			const { body: updatedRecipes } = await request(app.getHttpServer())
				.get(`/api/recipes`)
				.set("x-auth", token1)
				.expect(HttpStatus.OK);

			expect(updatedRecipes).to.have.lengthOf(1);
			expect(updatedRecipes[0].name).to.be.equal(
				"Tonnarelli cacio e pepe",
			);
			expect(updatedRecipes[0].description).to.be.equal(
				"Boil A LOT OF pasta and then put cheese and pepper on top.",
			);
			expect(updatedRecipes[0].ingredients).to.be.deep.equal([
				"Pasta",
				"Cheese",
				"Pepper",
				"Pecorino",
			]);
			expect(updatedRecipes[0].ownerId).to.be.equal(payload1.userId);

			await request(app.getHttpServer())
				.post(`/api/recipes`)
				.send({
					name: "Pasta Pesto",
					description: "Boil pasta and then put pesto.",
					ingredients: ["Pasta", "Pesto"],
				})
				.set("x-auth", token1)
				.expect(201);

			const { body: specificRecipe } = await request(app.getHttpServer())
				.get(`/api/recipes/${encodeURIComponent("Pasta Pesto")}`)
				.set("x-auth", token1)
				.expect(HttpStatus.OK);

			expect(specificRecipe.name).to.be.equal("Pasta Pesto");
			expect(specificRecipe.description).to.be.equal(
				"Boil pasta and then put pesto.",
			);
			expect(specificRecipe.ingredients).to.be.deep.equal([
				"Pasta",
				"Pesto",
			]);
			expect(specificRecipe.ownerId).to.be.equal(payload1.userId);

			const { body: remainingIngredients } = await request(
				app.getHttpServer(),
			)
				.get(
					`/api/recipes/missingIngredients/${encodeURIComponent("Pasta Pesto")}`,
				)
				.set("x-auth", token1)
				.expect(HttpStatus.OK);

			expect(remainingIngredients).be.of.length(1);
			expect(remainingIngredients[0]).equal("Pesto");
		});
	});
});
