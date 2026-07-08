import { UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";

import { LoginBody } from "../../../contracts/login.body";
import { UserStore } from "../../users/handlers/user.store";
import config from "../../../config";
import { AccessTokenView } from "../../../contracts/access.token.view";

export const createToken = async (
	body: LoginBody,
): Promise<AccessTokenView> => {
	const user = UserStore.getByEmail(body.email);
	if (!user || user.password !== body.password) {
		throw new UnauthorizedException("Invalid credentials");
	}

	const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
		expiresIn: "1h",
	});

	return {
		token,
		expiresIn: 3600,
	};
};
