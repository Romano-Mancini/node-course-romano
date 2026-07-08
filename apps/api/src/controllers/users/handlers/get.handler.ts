import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import { UserView } from "../../../contracts/user.view";
import { plainToInstance } from "class-transformer";

export const get = async (id: string) => {
	const user = await prisma.user.findUnique({
		where: { id },
	});

	if (!user) {
		throw new NotFoundException("User not found");
	}

	return plainToInstance(UserView, user, { excludeExtraneousValues: true });
};
