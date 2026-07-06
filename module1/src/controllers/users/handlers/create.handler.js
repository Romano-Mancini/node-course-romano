const { UserStore } = require("./user.store.js");

const create = (req, res, next) => {
	if (!req.body.name) {
		return next({ error: "name is required." });
	}
	const user = UserStore.add(req.body);
	res.json(user);
};

module.exports = { create };
