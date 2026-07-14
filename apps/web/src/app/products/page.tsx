"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
	useAddProductToFridge,
	useAllFridges,
	useDeleteProduct,
	useGetProducts,
	useGiftAllProducts,
	useGiftProduct,
	useProductsByLocation,
} from "@/lib/api-hooks";

import { isAuthenticated } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ProductsPage() {
	const router = useRouter();

	const [authChecked, setAuthChecked] = useState(false);

	const [fridgeId, setFridgeId] = useState("");

	const [name, setName] = useState("");

	const [type, setType] = useState("");

	const [size, setSize] = useState("");

	const [location, setLocation] = useState("");

	useEffect(() => {
		if (!isAuthenticated()) {
			router.replace("/login");
		} else {
			setAuthChecked(true);
		}
	}, [router]);

	const productsQuery = useGetProducts();

	const addProduct = useAddProductToFridge();

	const deleteProduct = useDeleteProduct();

	const giftProduct = useGiftProduct();

	const giftAll = useGiftAllProducts();

	const locationProducts = useProductsByLocation(location);

	const fridgesQuery = useAllFridges();

	if (!authChecked) return null;

	return (
		<main className="mx-auto max-w-3xl px-4 py-10">
			<h1 className="text-2xl font-semibold mb-6">Products</h1>

			<Card className="p-6 mb-6">
				<h2 className="font-semibold mb-4">Add product to fridge</h2>

				<select
					className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
					value={fridgeId}
					onChange={(e) => setFridgeId(e.target.value)}
				>
					<option value="">Select a fridge</option>

					{fridgesQuery.data?.map((fridge) => (
						<option key={fridge.id} value={String(fridge.id)}>
							{JSON.stringify(fridge)}
						</option>
					))}
				</select>

				<Input
					className="mt-2"
					placeholder="Product name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>

				<Input
					className="mt-2"
					placeholder="Product type"
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
				<h2 className="font-semibold mb-4">My products</h2>

				{productsQuery.isLoading && <p>Loading...</p>}

				{productsQuery.data?.map((product) => (
					<div key={product.id} className="border-b py-4">
						<p className="font-medium">{product.name}</p>

						<p className="text-sm text-slate-500">
							Type: {product.type}
							<br />
							Size: {product.size}
							<br />
							Fridge:
							{product.fridgeId}
						</p>

						<div className="flex gap-2 mt-3">
							<Button
								variant="danger"
								onClick={() =>
									deleteProduct.mutate({
										productId: product.id,
									})
								}
							>
								Delete
							</Button>

							<Button
								onClick={() => {
									const email = prompt("Receiver email");

									if (email) {
										giftProduct.mutate({
											productId: product.id,

											recipientEmail: email,
										});
									}
								}}
							>
								Gift
							</Button>
						</div>
					</div>
				))}
			</Card>

			<Card className="p-6 mt-6">
				<h2 className="font-semibold mb-4">Gift all products</h2>

				<Button
					onClick={() => {
						const email = prompt("Receiver email");

						if (email) {
							giftAll.mutate({
								recipientEmail: email,
							});
						}
					}}
				>
					Gift everything
				</Button>
			</Card>

			<Card className="p-6 mt-6">
				<h2 className="font-semibold mb-4">Products by location</h2>

				<Input
					placeholder="Location"
					value={location}
					onChange={(e) => setLocation(e.target.value)}
				/>

				<div className="mt-4">
					{location &&
						locationProducts.data?.map((product: any) => (
							<p key={product.id}>{product.name}</p>
						))}
				</div>
			</Card>
		</main>
	);
}
