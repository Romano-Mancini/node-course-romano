"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
	useCreateRecipe,
	useDeleteRecipe,
	useMissingIngredients,
	useRecipes,
	useRecipeSuggestions,
	useUpdateRecipe,
} from "@/lib/api-hooks";

import { clearToken, isAuthenticated } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RecipeForm } from "@/components/recipe-form";
import { UpdateRecipeForm } from "@/components/updaterecipe-form";

export default function FridgePage() {
	const router = useRouter();

	const [authChecked, setAuthChecked] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [updatingRecipe, setUpdatingRecipe] = useState("");
	const [isAnalyzingMissing, setIsAnalyzingMissing] = useState(false);
	const [analyzedMissingName, setAnalyzedMissingName] = useState("");

	const recipes = useRecipes();
	const createRecipe = useCreateRecipe();
	const deleteRecipe = useDeleteRecipe();
	const updateRecipe = useUpdateRecipe();
	const missingIngredients = useMissingIngredients(analyzedMissingName);
	const suggestedRecipes = useRecipeSuggestions();

	useEffect(() => {
		if (!isAuthenticated()) {
			router.replace("/login");
		} else {
			setAuthChecked(true);
		}
	}, [router]);

	if (!authChecked) return null;

	const logout = () => {
		clearToken();

		router.replace("/login");
	};

	return (
		<main className="mx-auto max-w-3xl px-4 py-10">
			<header className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Recipes</h1>

				<div className="flex gap-2">
					<Link href="/recipes">
						<Button>Recipes</Button>
					</Link>

					<Link href="/fridges">
						<Button>Fridges</Button>
					</Link>

					<Link href="/users">
						<Button>Users</Button>
					</Link>

					<Button variant="ghost" onClick={logout}>
						Log out
					</Button>
				</div>
			</header>
			<div className="pb-3">
				{" "}
				<Button
					type="button"
					variant="primary"
					onClick={() => {
						setIsCreating(true);
					}}
				>
					Add recipe
				</Button>
			</div>
			<div className="space-y-4">
				{recipes.data?.map((recipe) => {
					return (
						<Card key={recipe.name} className="p-4">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h2 className="font-semibold">
										{recipe.name}
									</h2>
								</div>
								<div className="flex gap-2">
									<Button
										type="button"
										variant="danger"
										onClick={() =>
											deleteRecipe.mutate({
												recipeName: recipe.name,
											})
										}
									>
										Delete
									</Button>

									<Button
										onClick={() => {
											setIsUpdating(true);
											setUpdatingRecipe(recipe.name);
										}}
									>
										Update recipe
									</Button>

									<Button
										onClick={() => {
											setIsAnalyzingMissing(true);
											setAnalyzedMissingName(recipe.name);
										}}
									>
										Get missing ingredients
									</Button>
								</div>
							</div>
							<div className="py-2">
								{" "}
								<h2 className="font-semibold">Ingredients:</h2>
								<p>{recipe.ingredients.join(", ")}</p>
							</div>

							<div className="py-2">
								{" "}
								<h2 className="font-semibold">Description:</h2>
								<p>{recipe.description}</p>
							</div>
						</Card>
					);
				})}
			</div>
			<h1 className="text-2xl py-5 font-semibold">Suggested Recipes:</h1>
			{suggestedRecipes.isLoading && (
				<div
					className="animate-spin inline-block size-6 border-3 border-current border-t-transparent rounded-[999px] text-muted-foreground-2"
					role="status"
					aria-label="loading"
				>
					<span className="sr-only">Loading...</span>
				</div>
			)}
			{suggestedRecipes.data?.map((recipe) => {
				return (
					<div
						className="py-2"
						key={recipe.name + recipe.description}
					>
						{" "}
						<Card
							key={recipe.name + recipe.description}
							className="p-4"
						>
							<div>
								<div className="py-2">
									<h2 className="font-semibold">
										{recipe.name}
									</h2>
								</div>
								<div className="py-2">
									<h2 className="font-semibold">
										Description:
									</h2>
									{recipe.description + "."}
								</div>
								<div className="py-2">
									<h2 className="font-semibold">
										Ingredients:{" "}
									</h2>
									{recipe.ingredients?.join(", ") ??
										"No ingredients"}
								</div>
							</div>
						</Card>
					</div>
				);
			})}
			{isCreating && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
					<Card className="w-full max-w-md p-5">
						<div className="mb-4">
							<h2 className="mb-3 text-base font-medium">
								Adding recipe:
							</h2>

							<RecipeForm
								submitLabel="Add"
								pending={createRecipe.isPending}
								onCancel={() => setIsCreating(false)}
								onSubmit={(body) => {
									createRecipe.mutate(
										{
											body: {
												name: body.name,
												ingredients:
													body.ingredients.split(" "),
												description: body.description,
											},
										},
										{
											onSuccess: () =>
												setIsCreating(false),
										},
									);
								}}
							/>
						</div>
					</Card>
				</div>
			)}{" "}
			{isUpdating && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
					<Card className="w-full max-w-md p-5">
						<div className="mb-4">
							<h2 className="mb-3 text-base font-medium">
								Updating recipe:
							</h2>

							<UpdateRecipeForm
								submitLabel="Update"
								pending={updateRecipe.isPending}
								onCancel={() => setIsUpdating(false)}
								onSubmit={(body) => {
									updateRecipe.mutate(
										{
											recipeName: updatingRecipe,
											body: {
												ingredients:
													body.ingredients.split(" "),
												description: body.description,
											},
										},
										{
											onSuccess: () =>
												setIsUpdating(false),
										},
									);
								}}
							/>
						</div>
					</Card>
				</div>
			)}{" "}
			{isAnalyzingMissing && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
					<Card className="w-full max-w-md p-5">
						<div className="mb-4">
							<h2 className="mb-3 text-base font-medium">
								Missing ingredients for recipe:{" "}
								{analyzedMissingName}
							</h2>
							<ul className="list-disc list-inside space-y-2 text-sm font-normal text-slate-600">
								{missingIngredients.data?.map(
									(ingredient: string) => (
										<li key={ingredient}>{ingredient}</li>
									),
								)}
							</ul>
						</div>
						<div className="flex justify-end">
							<Button
								type="button"
								variant="primary"
								onClick={() => setIsAnalyzingMissing(false)}
							>
								Back
							</Button>
						</div>
					</Card>
				</div>
			)}{" "}
		</main>
	);
}
