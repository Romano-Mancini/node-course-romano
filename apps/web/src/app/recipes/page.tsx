"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
	useCreateRecipe,
	useRecipes,
	useDeleteRecipe,
	useUpdateRecipe,
	useMissingIngredients,
} from "@/lib/api-hooks";

import { isAuthenticated } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RecipesPage() {
	const router = useRouter();

	const [authChecked, setAuthChecked] = useState(false);

	const [name, setName] = useState("");

	const [description, setDescription] = useState("");

	const [ingredients, setIngredients] = useState("");

	const [selectedRecipe, setSelectedRecipe] = useState("");

	useEffect(() => {
		if (!isAuthenticated()) {
			router.replace("/login");
		} else {
			setAuthChecked(true);
		}
	}, [router]);

	const recipesQuery = useRecipes();

	const createRecipe = useCreateRecipe();

	const deleteRecipe = useDeleteRecipe();

	const updateRecipe = useUpdateRecipe();

	const missingIngredients = useMissingIngredients(selectedRecipe);

	if (!authChecked) return null;

	const ingredientArray = ingredients
		.split(",")
		.map((i) => i.trim())
		.filter(Boolean);

	return (
		<main className="mx-auto max-w-3xl px-4 py-10">
			<h1 className="text-2xl font-semibold mb-6">Recipes</h1>

			<Card className="p-6 mb-6">
				<h2 className="font-semibold mb-4">Create recipe</h2>

				<Input
					placeholder="Recipe name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>

				<Input
					className="mt-2"
					placeholder="Description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				/>

				<Input
					className="mt-2"
					placeholder="Ingredients separated by comma"
					value={ingredients}
					onChange={(e) => setIngredients(e.target.value)}
				/>

				<Button
					className="mt-4"
					onClick={() => {
						createRecipe.mutate({
							body: {
								name,

								description,

								ingredients: ingredientArray,
							},
						});
					}}
				>
					Create
				</Button>
			</Card>

			<Card className="p-6">
				<h2 className="font-semibold mb-4">My recipes</h2>

				{recipesQuery.data?.map((recipe: any) => (
					<div key={recipe.name} className="border-b py-4">
						<p className="font-medium">{recipe.name}</p>

						<p className="text-sm text-slate-500">
							{recipe.description}
						</p>

						<div className="flex gap-2 mt-3">
							<Button
								variant="danger"
								onClick={() => {
									deleteRecipe.mutate({
										recipeName: recipe.name,
									});
								}}
							>
								Delete
							</Button>

							<Button
								onClick={() => {
									setSelectedRecipe(recipe.name);
								}}
							>
								Missing ingredients
							</Button>

							<Button
								onClick={() => {
									updateRecipe.mutate({
										recipeName: recipe.name,

										body: {
											description: recipe.description,

											ingredients: recipe.ingredients,
										},
									});
								}}
							>
								Update
							</Button>
						</div>
					</div>
				))}
			</Card>

			{selectedRecipe && (
				<Card className="p-6 mt-6">
					<h2 className="font-semibold mb-3">
						Missing ingredients for: {selectedRecipe}
					</h2>

					{missingIngredients.data ? (
						<pre className="text-sm">
							{JSON.stringify(missingIngredients.data, null, 2)}
						</pre>
					) : (
						<p>Loading...</p>
					)}
				</Card>
			)}
		</main>
	);
}
