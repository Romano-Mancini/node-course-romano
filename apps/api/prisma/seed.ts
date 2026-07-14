import { PrismaClient, Type } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	// Clear existing data
	await prisma.user.deleteMany();

	// Create initial users
	const [john, jane] = await Promise.all([
		prisma.user.create({
			data: {
				name: "John",
				surname: "Doe",
				email: "john@example.com",
				password: await bcrypt.hash("password123", 10),
			},
		}),
		prisma.user.create({
			data: {
				name: "Jane",
				surname: "Smith",
				email: "jane@example.com",
				password: await bcrypt.hash("password456", 10),
			},
		}),
	]);

	const fridge1 = await prisma.fridge.create({
		data: {
			location: "Oude Markt",
			capacity: 50,
		},
	});

	const fridge2 = await prisma.fridge.create({
		data: {
			location: "Grote Markt",
			capacity: 100,
		},
	});

	await prisma.product.createMany({
		data: [
			{
				name: "Milk",
				type: Type.DRINK,
				size: 1,
				ownerId: john.id,
				fridgeId: fridge1.id,
			},
			{
				name: "Eggs",
				type: Type.FOOD,
				size: 12,
				ownerId: john.id,
				fridgeId: fridge1.id,
			},
			{
				name: "Orange Juice",
				type: Type.DRINK,
				size: 2,
				ownerId: jane.id,
				fridgeId: fridge2.id,
			},
			{
				name: "Cheese",
				type: Type.FOOD,
				size: 500,
				ownerId: jane.id,
				fridgeId: fridge2.id,
			},
		],
	});

	await prisma.recipe.createMany({
		data: [
			{
				name: "Omelette",
				description: "A simple egg omelette",
				ingredients: ["Eggs", "Cheese", "Salt"],
				ownerId: john.id,
			},
			{
				name: "Smoothie",
				description: "Fresh fruit smoothie",
				ingredients: ["Milk", "Banana", "Orange Juice"],
				ownerId: jane.id,
			},
		],
	});

	console.log(john);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
