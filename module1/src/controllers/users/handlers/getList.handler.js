const { UserStore } = require("./user.store.js");

const getList = (req, res, next) => {
	const users = UserStore.find(req.query.search);
	res.json(users);
};

module.exports = { getList };
