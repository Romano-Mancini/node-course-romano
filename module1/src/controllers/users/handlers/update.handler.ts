import { NotFoundException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { UserBody } from "../../../contracts/user.body";
import { UserView } from "../../../contracts/user.view";
import { UserStore } from "./user.store";

export const update = (idString: string, body: UserBody): UserView => {
	const id = Number(idString);
	const user = UserStore.get(id);
	if (!user) {
		throw new NotFoundException("User not found");
	}
	const updated = UserStore.update(id, { ...user, ...body });
	return plainToInstance(UserView, updated);
};
