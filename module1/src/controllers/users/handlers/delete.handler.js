// delete.handler.js
const { UserStore } = require("./user.store.js");

const deleteUser = (req, res, next) => {
	const user = UserStore.get(req.params.id);
	// Duplicated in multiple places for now. This will be refactored later.
	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}
	UserStore.delete(req.params.id);
	res.status(204);
	res.send();
};

module.exports = { deleteUser };
