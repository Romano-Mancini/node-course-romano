"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ProductBody } from "@node-course/api-sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
	name: z.string().min(1, "Name is required"),
	type: z.string().min(1, "Type is required"),
	size: z.number().min(1, "Size must be at least 1"),
});

type ProductFormValues = z.infer<typeof schema>;

export function ProductForm({
	submitLabel,
	pending,
	onSubmit,
	onCancel,
}: {
	submitLabel: string;
	pending: boolean;
	onSubmit: (body: ProductBody) => void;
	onCancel: () => void;
}) {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ProductFormValues>({
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
				<Label htmlFor="type">Type</Label>
				<select
					id="type"
					{...register("type")}
					className="w-full rounded-md border px-3 py-2"
				>
					<option value="FOOD">Food</option>
					<option value="DRINK">Drink</option>
				</select>

				{errors.type && (
					<p className="mt-1 text-sm text-red-600">
						{errors.type.message}
					</p>
				)}
			</div>

			<div>
				<Label htmlFor="size">Size</Label>
				<Input
					id="size"
					type="number"
					{...register("size", { valueAsNumber: true })}
				/>
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
