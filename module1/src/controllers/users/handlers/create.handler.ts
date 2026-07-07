import { UserStore } from "./user.store";
import { type Request, type Response, type NextFunction } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UserBody } from "../../../contracts/user.body";
import { UserView } from "../../../contracts/user.view";

export const create = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const transformed = plainToInstance(UserBody, req.body);
	const validationErrors = await validate(transformed, {
		skipMissingProperties: false,
		whitelist: true,
		forbidNonWhitelisted: true,
	});

	if (validationErrors.length) {
		return next(validationErrors);
	}
	const user = UserStore.add(transformed);
	res.json(plainToInstance(UserView, user));
};
