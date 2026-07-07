import { UserStore } from "./user.store";
import { type Request, type Response, type NextFunction } from "express";
import { UserBody } from "../../../contracts/user.body";
import { UserView } from "../../../contracts/user.view";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

export const update = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	let id = req.params.id;
	const fieldsToUpdate = plainToInstance(UserBody, req.body, {
		exposeUnsetFields: false,
	});
	const validationErrors = await validate(fieldsToUpdate, {
		skipMissingProperties: true, // Allow partial updates
		whitelist: true,
		forbidNonWhitelisted: true,
	});

	if (
		validationErrors.length ||
		Array.isArray(id) ||
		Number.isNaN(Number(id))
	) {
		return next(validationErrors);
	}

	const user = UserStore.get(Number(id));
	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}
	const updated = UserStore.update(Number(id), {
		...user,
		...fieldsToUpdate,
	});
	res.json(plainToInstance(UserView, updated));
};
