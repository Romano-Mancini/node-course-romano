import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import { User, UserStore } from "../../controllers/users/handlers/user.store";
import { getList } from "../../controllers/users/handlers/getList.handler";
import { get } from "../../controllers/users/handlers/get.handler";
import { create } from "../../controllers/users/handlers/create.handler";
import { update } from "../../controllers/users/handlers/update.handler";
import { deleteUser } from "../../controllers/users/handlers/delete.handler";

import type { Request, Response } from "express";

describe("Handler tests", () => {
	const userFixtures: User[] = [
		{
			name: "test1",
			email: "test-user+1@panenco.com",
			id: 0,
			password: "password1",
		},
		{
			name: "test2",
			email: "test-user+2@panenco.com",
			id: 1,
			password: "password2",
		},
	];
	describe("User Tests", () => {
		describe("Users handler tests", () => {
			let res: any;
			let statusCode: number | null = null;
			beforeEach(() => {
				UserStore.users = [];
				UserStore.add({
					name: "test1",
					email: "test-user+1@panenco.com",
					password: "test",
				});
				UserStore.add({
					name: "test2",
					email: "test-user+2@panenco.com",
					password: "test",
				});
			});

			it("should search users", () => {
				getList(
					{ query: { search: "test1" } } as unknown as Request,
					{ json: (val) => (res = val) } as Response,
					null as any,
				);
				expect(res.length).equal(1);
				expect(res.some((x: User) => x.name === "test1")).true;
			});

			it("should get users", () => {
				getList(
					{ query: { search: undefined } } as unknown as Request,
					{ json: (val) => (res = val) } as Response,
					null as any,
				);
				expect(res.length).equal(2);
				expect(res[0].name === "test1" && res[1].name === "test2");
			});

			it("should get user by id", () => {
				get(
					{ params: { id: 0 } } as unknown as Request,
					{ json: (val) => (res = val) } as Response,
					null as any,
				);
				expect(res.name === "test1").true;

				get(
					{ params: { id: 2 } } as unknown as Request,
					{
						status: (code) => {
							statusCode = code;
							return {
								json: (val) => (res = val),
							};
						},
						json: (val) => (res = val),
					} as Response,
					null as any,
				);
				expect(statusCode).equal(404);
			});

			it("should create user", async () => {
				await create(
					{
						body: {
							name: "test3",
							email: "test-user+3@panenco.com",
							password: "eightCharacters",
						},
					} as unknown as Request,
					{ json: (val) => (res = val) } as Response,
					null as any,
				);
				expect(
					res.name === "test3" &&
						res.email === "test-user+3@panenco.com",
				).true;

				getList(
					{ query: { search: undefined } } as unknown as Request,
					{ json: (val) => (res = val) } as Response,
					null as any,
				);
				expect(res.some((x: User) => x.name === "test3")).true;
			});

			it("should update user", async () => {
				await update(
					{
						params: { id: 0 },
						body: { name: "test4" },
					} as unknown as Request,
					{
						status: (code) => {
							statusCode = code;
							return {
								json: (val) => (res = val),
							};
						},
						json: (val) => (res = val),
					} as Response,
					null as any,
				);

				get(
					{ params: { id: 0 } } as unknown as Request,
					{ json: (val) => (res = val) } as Response,
					null as any,
				);
				expect(res.name === "test4").true;

				await update(
					{
						params: { id: 5 },
						body: { name: "test4" },
					} as unknown as Request,
					{
						status: (code) => {
							statusCode = code;
							return {
								json: (val) => (res = val),
							};
						},
						json: (val) => (res = val),
					} as Response,
					null as any,
				);

				expect(statusCode).equal(404);
			});

			it("should delete user by id", () => {
				deleteUser(
					{ params: { id: 0 } } as unknown as Request,
					{
						status: (code) => {
							statusCode = code;
							return {
								json: (val) => (res = val),
							};
						},
						json: (val) => (res = val),
					} as Response,
					null as any,
				);

				getList(
					{ query: { search: undefined } } as unknown as Request,
					{ json: (val) => (res = val) } as Response,
					null as any,
				);
				expect(res.some((x: User) => x.name === "test1")).false;

				deleteUser(
					{ params: { id: 0 } } as unknown as Request,
					{
						status: (code) => {
							statusCode = code;
							return {
								json: (val) => (res = val),
							};
						},
						json: (val) => (res = val),
					} as Response,
					null as any,
				);

				expect(statusCode).equal(404);
			});
		});
	});
});
