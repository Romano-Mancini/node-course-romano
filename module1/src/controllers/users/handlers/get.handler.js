// get.handler.js
const { UserStore } = require("./user.store.js");

const get = (req, res, next) => {
	const user = UserStore.get(req.params.id);
	if (!user) {
		res.status(404).json({ error: "User not found" });
		return;
	}
	res.json(user);
};

module.exports = { get };
