import { Controller, Post, Body, HttpCode } from "@nestjs/common";

import { AccessTokenView } from "../../contracts/access.token.view";
import { LoginBody } from "../../contracts/login.body";
import { createToken } from "./handlers/login.handler";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller("auth")
export class AuthController {
	@Post("login")
	@HttpCode(200)
	@ApiOperation({ operationId: "login", summary: "Log in a user" })
	@ApiResponse({
		status: 200,
		description: "Users logged in successfully",
		type: AccessTokenView,
	})
	async login(@Body() body: LoginBody): Promise<AccessTokenView> {
		return createToken(body);
	}
}
