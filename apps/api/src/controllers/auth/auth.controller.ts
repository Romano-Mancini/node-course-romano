import { Controller, Post, Body, HttpCode } from "@nestjs/common";

import { AccessTokenView } from "../../contracts/access.token.view";
import { LoginBody } from "../../contracts/login.body";
import { createToken } from "./handlers/login.handler";

@Controller("auth")
export class AuthController {
	@Post("login")
	@HttpCode(200)
	async login(@Body() body: LoginBody): Promise<AccessTokenView> {
		return createToken(body);
	}
}
