const { Test } = require("@nestjs/testing");
const { ValidationPipe } = require("@nestjs/common");
const { expect } = require("chai");
const request = require("supertest");

import { AppModule } from "../../app.module";
import { UserBody } from "../../contracts/user.body";
import { prisma } from "../../lib/prisma";

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
			await prisma.user.deleteMany(); // Clean up users before each test
		});

		after(async () => {
			await app.close();
		});

		it("should CRUD users with authentication", async () => {
			console.log("getlist");
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

			// Get all users with valid token
			const { body: getListRes } = await request(app.getHttpServer())
				.get(`/api/users`)
				.set("x-auth", token)
				.expect(200);
			expect(getListRes.length).equal(1);
			expect(getListRes[0].name).equal("test");

			expect(
				getListRes.some((x: any) => x.email === createResponse.email),
			).true;

			// Try to access protected endpoint without token (should fail)
			await request(app.getHttpServer()).get(`/api/users`).expect(401);

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

			console.log(updateResponse);
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
