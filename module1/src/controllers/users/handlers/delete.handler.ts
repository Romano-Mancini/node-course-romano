import { NotFoundException } from "@nestjs/common";

import { UserStore } from "./user.store";

export const deleteUser = (idString: string) => {
	const id = Number(idString);
	const user = UserStore.get(id);
	if (!user) {
		throw new NotFoundException("User not found");
	}
	UserStore.delete(id);
};
