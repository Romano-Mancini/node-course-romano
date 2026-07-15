"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ProductBody, RecipeBody } from "@node-course/api-sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
	name: z.string().min(1, "Name is required"),
	ingredients: z.string().min(1, "Ingredients must be provided"),
	description: z.string().min(1, "Description must be provided"),
});

type RecipeFormValues = z.infer<typeof schema>;
interface simplifiedRecipe {
	name: string;
	ingredients: string;
	description: string;
}

export function RecipeForm({
	submitLabel,
	pending,
	onSubmit,
	onCancel,
}: {
	submitLabel: string;
	pending: boolean;
	onSubmit: (body: simplifiedRecipe) => void;
	onCancel: () => void;
}) {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RecipeFormValues>({
		resolver: zodResolver(schema),
	});
	return (
		<form
			onSubmit={handleSubmit((values) => onSubmit(values))}
			className="space-y-4"
			noValidate
		>
			<div>
				<Label htmlFor="name">Name</Label>
				<Input id="name" {...register("name")} />
				{errors.name && (
					<p className="mt-1 text-sm text-red-600">
						{errors.name.message}
					</p>
				)}
			</div>

			<div>
				<Label htmlFor="ingredients">
					Ingredients separated by space
				</Label>
				<Input id="ingredients" {...register("ingredients")} />
				{errors.ingredients && (
					<p className="mt-1 text-sm text-red-600">
						{errors.ingredients.message}
					</p>
				)}
			</div>

			<div>
				<Label htmlFor="description">Description</Label>
				<Input id="description" {...register("description")} />
				{errors.description && (
					<p className="mt-1 text-sm text-red-600">
						{errors.description.message}
					</p>
				)}
			</div>

			<div className="flex justify-end gap-2 pt-2">
				<Button type="button" variant="secondary" onClick={onCancel}>
					Cancel
				</Button>

				<Button type="submit" disabled={pending}>
					{pending ? "Saving…" : submitLabel}
				</Button>
			</div>
		</form>
	);
}
