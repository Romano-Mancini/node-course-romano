"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
	useAddProductToFridge,
	useAllFridges,
	useAllProducts,
} from "@/lib/api-hooks";

import { clearToken, isAuthenticated } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductView } from "@node-course/api-sdk";
import { ProductForm } from "@/components/product-form";

export default function FridgePage() {
	const router = useRouter();

	const [authChecked, setAuthChecked] = useState(false);

	const [location, setLocation] = useState("");
	const [fridgeID, setFridgeId] = useState("");
	const [adding, setAdding] = useState(false);
	const [selectedFridgeId, setSelectedFridgeId] = useState("");

	useEffect(() => {
		if (!isAuthenticated()) {
			router.replace("/login");
		} else {
			setAuthChecked(true);
		}
	}, [router]);

	const fridges = useAllFridges();
	const products = useAllProducts(location, fridgeID);
	const addproduct = useAddProductToFridge();
	const fridgeMap = new Map(
		fridges.data?.map((fridge) => [fridge.id, fridge.location]) ?? [],
	);
	const productsByFridge = new Map<string, ProductView[]>();

	products.data?.forEach((product) => {
		const existing = productsByFridge.get(product.fridgeId) ?? [];
		existing.push(product);
		productsByFridge.set(product.fridgeId, existing);
	});

	if (!authChecked) return null;

	const logout = () => {
		clearToken();

		router.replace("/login");
	};

	return (
		<main className="mx-auto max-w-3xl px-4 py-10">
			<header className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Fridges</h1>

				<div className="flex gap-2">
					<Link href="/products">
						<Button>Products</Button>
					</Link>

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

			<h1 className="font-semibold">Filter by location</h1>

			<Input
				placeholder="Search by fridge location"
				value={location}
				onChange={(event) => setLocation(event.target.value)}
				className="mb-4"
			/>

			<h1 className="font-semibold">Filter by fridge ID</h1>

			<Input
				placeholder="Search by fridge ID"
				value={fridgeID}
				onChange={(event) => setFridgeId(event.target.value)}
				className="mb-4"
			/>

			<h1 className="font-semibold mb-2">Fridges:</h1>

			<div className="space-y-4">
				{fridges.data?.map((fridge) => {
					const fridgeProducts =
						productsByFridge.get(fridge.id) ?? [];

					return (
						<Card key={fridge.id} className="p-4">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h2 className="font-semibold">
										Fridge: {fridge.id}
									</h2>

									<p className="text-sm text-slate-500">
										Location: {fridge.location}
									</p>
								</div>

								<Button
									onClick={() => {
										setSelectedFridgeId(fridge.id);
										setAdding(true);
									}}
								>
									Add product
								</Button>
							</div>

							{fridgeProducts.length === 0 ? (
								<p className="text-sm text-slate-500">
									No products in this fridge.
								</p>
							) : (
								<div className="divide-y divide-slate-100">
									{fridgeProducts.map((product) => (
										<div key={product.id} className="py-3">
											<p>
												<span className="font-bold">
													Product:
												</span>{" "}
												{product.name}
											</p>
										</div>
									))}
								</div>
							)}
						</Card>
					);
				})}
			</div>

			{adding && (
				<div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 p-4">
					<Card className="w-full max-w-md p-6">
						<h2 className="mb-4 text-lg font-semibold">
							Add product
						</h2>

						<ProductForm
							submitLabel="Add"
							pending={addproduct.isPending}
							onCancel={() => setAdding(false)}
							onSubmit={(body) => {
								addproduct.mutate(
									{
										body,
										fridgeId: selectedFridgeId,
									},
									{
										onSuccess: () => setAdding(false),
									},
								);
							}}
						/>
					</Card>
				</div>
			)}
		</main>
	);
}
