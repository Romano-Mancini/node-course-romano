import { NotFoundException } from "@nestjs/common";

import { UserStore } from "./user.store";

export const get = (idString: string) => {
	const id = Number(idString);
	const user = UserStore.get(id);
	if (!user) {
		throw new NotFoundException("User not found");
	}
	return user;
};
