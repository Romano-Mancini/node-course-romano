"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
	useAddProductToFridge,
	useDeleteWholeFridge,
	useFridgeProducts,
	useGiftAllProductsFromFridge,
} from "@/lib/api-hooks";

import { isAuthenticated } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function FridgePage() {
	const router = useRouter();

	const params = useParams();

	const fridgeId = params.fridgeId as string;

	const [authChecked, setAuthChecked] = useState(false);

	const [name, setName] = useState("");

	const [type, setType] = useState("");

	const [size, setSize] = useState("");

	useEffect(() => {
		if (!isAuthenticated()) {
			router.replace("/login");
		} else {
			setAuthChecked(true);
		}
	}, [router]);

	const productsQuery = useFridgeProducts(fridgeId);

	const addProduct = useAddProductToFridge();

	const deleteFridge = useDeleteWholeFridge();

	const giftAll = useGiftAllProductsFromFridge();

	if (!authChecked) return null;

	return (
		<main className="mx-auto max-w-3xl px-4 py-10">
			<h1 className="text-2xl font-semibold mb-6">Fridge</h1>

			<p className="text-sm text-slate-500 mb-6">ID: {fridgeId}</p>

			<Card className="p-6 mb-6">
				<h2 className="font-semibold mb-4">Add product</h2>

				<Input
					placeholder="Product name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>

				<Input
					className="mt-2"
					placeholder="Type"
					value={type}
					onChange={(e) => setType(e.target.value)}
				/>

				<Input
					className="mt-2"
					type="number"
					placeholder="Size"
					value={size}
					onChange={(e) => setSize(e.target.value)}
				/>

				<Button
					className="mt-4"
					onClick={() => {
						addProduct.mutate({
							fridgeId,

							body: {
								name,

								type,

								size: Number(size),
							},
						});
					}}
				>
					Add product
				</Button>
			</Card>

			<Card className="p-6">
				<h2 className="font-semibold mb-4">Products inside fridge</h2>

				{productsQuery.isLoading && <p>Loading...</p>}

				{productsQuery.data?.length === 0 && <p>No products</p>}

				{productsQuery.data?.map((product) => (
					<div key={product.id} className="border-b py-3">
						<p className="font-medium">{product.name}</p>

						<p className="text-sm text-slate-500">
							{product.type}-{product.size}
						</p>
					</div>
				))}
			</Card>

			<Card className="p-6 mt-6">
				<h2 className="font-semibold mb-4">Fridge actions</h2>

				<Button
					onClick={() => {
						const email = prompt("Receiver email");

						if (email) {
							giftAll.mutate({
								fridgeId,

								receiverEmail: email,
							});
						}
					}}
				>
					Gift all fridge products
				</Button>

				<Button
					className="ml-2"
					variant="danger"
					onClick={() => {
						if (confirm("Delete all products from this fridge?")) {
							deleteFridge.mutate({
								fridgeId,
							});
						}
					}}
				>
					Delete all products
				</Button>
			</Card>
		</main>
	);
}
