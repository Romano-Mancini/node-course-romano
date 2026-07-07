import { User, UserStore } from "../../controllers/users/handlers/user.store";
import { App } from "../../app";
import supertest from "supertest";
import { describe, it, beforeEach } from "mocha";
import { expect } from "chai";

describe("Integration tests", () => {
	describe("User Tests", () => {
		let request: any;
		beforeEach(() => {
			UserStore.users = [];
			const app = new App();
			request = supertest(app.host);
		});

		it("full endpoint test", async () => {
			// create a new user
			const { body: createResponse } = await request
				.post(`/api/users`)
				.send({
					name: "test",
					email: "test-user+1@panenco.com",
					password: "real secret stuff",
				} as User)
				.set("auth", "api-key");

			const { body: getResponse } = await request.get(`/api/users/0`);

			const { body: updateResponse } = await request
				.patch(`/api/users/0`)
				.send({
					name: "updatedName",
				} as User);

			const { body: getAgainResponse } = await request
				.get(`/api/users/${getResponse.id}`)
				.set("x-auth", "api-key");

			expect(getAgainResponse.name === "updatedName").true;
			expect(getAgainResponse.email === "test-user+1@panenco.com").true;
			expect(getAgainResponse.password === "real secret stuff").true;

			const { body: deleteResponse } = await request.delete(
				`/api/users/${getResponse.id}`,
			);

			const { body: getAllUsersResponse } = await request
				.get(`/api/users`)
				.set("auth", "api-key");
			expect(
				getAllUsersResponse.some((x: User) => x.name === "updatedName"),
			).false;
		});
	});
});
