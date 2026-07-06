import { UserStore } from "./user.store";
import { type Request, type Response, type NextFunction } from "express";

export const getList = (req: Request, res: Response, next: NextFunction) => {
	let rawSearch = req.query.search;
	if (Array.isArray(rawSearch)) {
		rawSearch = rawSearch[0];
	}
	if (typeof rawSearch === "string") {
		const users = UserStore.find(rawSearch);
		res.json(users);
	} else {
		const users = UserStore.find();
		res.json(users);
	}
};
