import { UserBody } from "../../../contracts/user.body";
import { UserStore } from "./user.store";

export const create = async (body: UserBody) => {
	const user = UserStore.add(body);

	return user;
};
