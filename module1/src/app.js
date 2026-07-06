// src/app.js
const express = require("express");
const { UserRoute } = require("./controllers/users/user.route");

class App {
	constructor() {
		// Init server
		this.host = express();
		this.host.use(express.json());
		this.host.use((req, res, next) => {
			console.log(req.method, req.url);
			next();
		});

		this.host.get("/", (req, res, next) => {
			res.send("Hello World!");
		});

		const usersRoute = new UserRoute();
		this.host.use(`/api/${usersRoute.path}`, usersRoute.router);

		this.host.use((req, res, next) => {
			res.status(404).json({ error: "No endpoint found." });
		});

		this.host.use((error, req, res, next) => {
			res.status(400).json(error);
		});
	}

	listen() {
		this.host.listen(3000, () => {
			console.info(`🚀 http://localhost:3000`);
			console.info(`========================`);
		});
	}
}

module.exports = { App };
