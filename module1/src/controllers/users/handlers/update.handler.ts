import { UserStore } from "./user.store";
import { type Request, type Response, type NextFunction } from "express";

export const update = (req: Request, res: Response, next: NextFunction) => {
	const rawId = req.params.id;
	const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
	const id = Number(idStr);
	const user = UserStore.get(id);

	if (!user) {
		res.status(404).json({ error: "User not found" });
		return;
	}
	const updated = UserStore.update(id, req.body);
	res.json(updated);
};
