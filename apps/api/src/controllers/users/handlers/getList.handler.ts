import { plainToInstance } from "class-transformer";
import { UserView } from "../../../contracts/user.view";
import { prisma } from "../../../lib/prisma";

export const getList = async (search?: string) => {
	const where = search
		? {
				OR: [
					{
						name: {
							contains: search,
							mode: "insensitive" as const,
						},
					},
					{
						email: {
							contains: search,
							mode: "insensitive" as const,
						},
					},
				],
			}
		: {};

	const users = await prisma.user.findMany({
		where,
		orderBy: { createdAt: "desc" },
	});
	return plainToInstance(UserView, users, { excludeExtraneousValues: true });
};
