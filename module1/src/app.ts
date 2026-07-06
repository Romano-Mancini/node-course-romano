import express from "express";
import type { Application, Request, Response, NextFunction } from "express";
import { UserRoute } from "./controllers/users/user.route";

export class App {
	host: Application;

	constructor() {
		// Init server
		this.host = express();
		this.host.use(express.json());
		this.host.use((req: Request, res: Response, next: NextFunction) => {
			console.log(req.method, req.url);
			next();
		});

		this.host.get(
			"/",
			(req: Request, res: Response, next: NextFunction) => {
				res.send("Hello World!");
			},
		);

		const usersRoute = new UserRoute();
		this.host.use(`/api/${usersRoute.path}`, usersRoute.router);

		this.host.use((req: Request, res: Response, next: NextFunction) => {
			res.status(404).json({ error: "No endpoint found." });
		});

		this.host.use(
			(error: any, req: Request, res: Response, next: NextFunction) => {
				res.status(400).json(error);
			},
		);
	}

	listen() {
		this.host.listen(3000, () => {
			console.info(`🚀 http://localhost:3000`);
			console.info(`========================`);
		});
	}
}
