import { UserStore } from "./user.store";
import { type Request, type Response, type NextFunction } from "express";

export const create = (req: Request, res: Response, next: NextFunction) => {
	if (!req.body.name) {
		return next({ error: "name is required." });
	}
	const user = UserStore.add(req.body);
	res.json(user);
};
