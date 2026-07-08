import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { expect } from "chai";
import { before, beforeEach, after, describe, it } from "mocha";
import request from "supertest";

import { AppModule } from "../../app.module";
import { UserBody } from "../../contracts/user.body";
import { User, UserStore } from "../../controllers/users/handlers/user.store";
import { prisma } from "../../lib/prisma";

describe("Integration tests", () => {
	describe("User Tests", () => {
		let app: INestApplication;

		before(async () => {
			const moduleFixture: TestingModule = await Test.createTestingModule(
				{
					imports: [AppModule],
				},
			).compile();

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

		beforeEach(() => {
			prisma.user.deleteMany(); // Clean up users before each test
		});

		after(async () => {
			await app.close();
		});

		it("should CRUD users with authentication", async () => {
			// Successfully create new user (public endpoint)
			const { body: createResponse } = await request(app.getHttpServer())
				.post(`/api/users`)
				.send({
					name: "test",
					email: "test-user+1@panenco.com",
					password: "real secret stuff",
				})
				.expect(201);

			expect(
				UserStore.users.some((x) => x.email === createResponse.email),
			).true;

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

			// Try to access protected endpoint without token (should fail)
			await request(app.getHttpServer()).get(`/api/users`).expect(401);

			// Get all users with valid token
			const { body: getListRes } = await request(app.getHttpServer())
				.get(`/api/users`)
				.set("x-auth", token)
				.expect(200);
			expect(getListRes.length).equal(1);
			expect(getListRes[0].name).equal("test");

			// Get the newly created user with token
			const { body: getResponse } = await request(app.getHttpServer())
				.get(`/api/users/${createResponse.id}`)
				.set("x-auth", token)
				.expect(200);
			expect(getResponse.name).equal("test");

			// Successfully update user with token
			const { body: updateResponse } = await request(app.getHttpServer())
				.patch(`/api/users/${createResponse.id}`)
				.send({
					email: "test-user+updated@panenco.com",
				})
				.set("x-auth", token)
				.expect(200);

			expect(updateResponse.name).equal("test");
			expect(updateResponse.email).equal("test-user+updated@panenco.com");
			expect(updateResponse.password).undefined; // password excluded from response

			// Delete the user with token
			await request(app.getHttpServer())
				.delete(`/api/users/${createResponse.id}`)
				.set("x-auth", token)
				.expect(204);

			// Verify user is deleted
			const { body: getNoneResponse } = await request(app.getHttpServer())
				.get(`/api/users`)
				.set("x-auth", token)
				.expect(200);
			expect(getNoneResponse.length).equal(0);
		});
	});
});
