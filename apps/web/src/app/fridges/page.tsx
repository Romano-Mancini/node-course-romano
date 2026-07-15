"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
	useAddProductToFridge,
	useAllFridges,
	useAllProducts,
	useDeleteAllProducts,
	useDeleteProduct,
	useDeleteWholeFridge,
	useGiftAllProducts,
	useGiftAllProductsFromFridge,
	useGiftProduct,
	useProduct,
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
	const [checkingDetails, setCheckingDetails] = useState(false);
	const [checkingId, setCheckingId] = useState("");
	const [selectedFridgeId, setSelectedFridgeId] = useState("");
	const [isGifting, setIsGifting] = useState(false);
	const [giftingId, setGiftingId] = useState("");
	const [receiverEmail, setReceiverEmail] = useState("");

	const [isGiftingWhole, setIsGiftingWhole] = useState(false);
	const [giftingIdWhole, setGiftingIdWhole] = useState("");
	const [receiverEmailWhole, setReceiverEmailWhole] = useState("");

	const [isGiftingAllProducts, setIsGiftingAllProducts] = useState(false);
	const [receiverEmailAllProducts, setReceiverEmailAllProducts] =
		useState("");

	useEffect(() => {
		if (!isAuthenticated()) {
			router.replace("/login");
		} else {
			setAuthChecked(true);
		}
	}, [router]);

	const fridges = useAllFridges();
	const fridgesData = fridges.data;
	const products = useAllProducts(location, fridgeID);
	const addproduct = useAddProductToFridge();
	const checkedProduct = useProduct(checkingId);
	const deleteFridge = useDeleteWholeFridge();
	const deleteAllItems = useDeleteAllProducts();
	const giftProduct = useGiftProduct();
	const giftAllProducts = useGiftAllProducts();
	const giftWholeFridge = useGiftAllProductsFromFridge();

	const deleteProduct = useDeleteProduct();
	const productsByFridge = new Map<string, ProductView[]>();
	const filteredFridges =
		fridges.data?.filter((fridge) => {
			const matchesLocation = location
				? fridge.location.toLowerCase().includes(location.toLowerCase())
				: true;

			const matchesId = fridgeID ? fridge.id.includes(fridgeID) : true;

			return matchesLocation && matchesId;
		}) ?? [];
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
			<h1 className="font-semibold mb-2">Filter by location:</h1>
			<Input
				placeholder="Search by fridge location"
				value={location}
				onChange={(event) => setLocation(event.target.value)}
				className="mb-4"
			/>
			<h1 className="font-semibold mb-2">Filter by fridge ID:</h1>
			<Input
				placeholder="Search by fridge ID"
				value={fridgeID}
				onChange={(event) => setFridgeId(event.target.value)}
				className="mb-4"
			/>
			<h1 className="font-semibold mb-2">Fridges:</h1>
			<div className="space-y-4">
				{fridgesData &&
					filteredFridges.map((fridge) => {
						const fridgeProducts =
							productsByFridge.get(fridge.id) ?? [];

						return (
							<Card key={fridge.id} className="p-4">
								<div className="flex items-center justify-between mb-4">
									<div>
										<h2 className="font-semibold">
											ID:{" "}
											{fridge.id !== undefined
												? fridge.id.substring(0, 28) +
													"..."
												: "No ID"}
										</h2>

										<p className="text-sm text-slate-500">
											Location: {fridge.location}
										</p>
									</div>
									<div className="flex gap-2">
										<Button
											type="button"
											variant="danger"
											onClick={() => {
												deleteFridge.mutate({
													fridgeId: fridge.id,
												});
											}}
										>
											Delete all
										</Button>

										<Button
											onClick={() => {
												setSelectedFridgeId(fridge.id);
												setAdding(true);
											}}
										>
											Add product
										</Button>

										<Button
											onClick={() => {
												setIsGiftingWhole(true);
												setGiftingIdWhole(fridge.id);
											}}
										>
											Gift whole fridge
										</Button>
									</div>
								</div>

								{fridgeProducts.length === 0 ? (
									<p className="text-sm text-slate-500">
										You have no products in this fridge.
									</p>
								) : (
									<div className="divide-y divide-slate-100">
										{fridgeProducts.map((product) => (
											<div
												key={product.id}
												className="py-2 flex items-center justify-between"
											>
												<p>
													<span className="font-bold">
														Product:
													</span>{" "}
													{product.name}
												</p>
												<div>
													<Button
														variant="ghost"
														onClick={() => {
															setIsGifting(true);
															setGiftingId(
																product.id,
															);
														}}
													>
														Gift product
													</Button>

													<Button
														variant="ghost"
														onClick={() => {
															setCheckingDetails(
																true,
															);
															setCheckingId(
																product.id,
															);
														}}
													>
														View Details
													</Button>
												</div>
											</div>
										))}
									</div>
								)}
							</Card>
						);
					})}
			</div>
			{adding && (
				<div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 p-4 text-sm text-slate-500">
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
			<div className="mt-3 flex  justify-end pt-2 gap-2">
				<Button
					type="button"
					variant="secondary"
					onClick={() => {
						setIsGiftingAllProducts(true);
					}}
				>
					Gift all your products
				</Button>

				<Button
					type="button"
					variant="danger"
					onClick={() => deleteAllItems.mutate()}
				>
					Delete all your products
				</Button>
			</div>
			{isGifting && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
					<Card className="w-full max-w-md p-5">
						<div className="mb-4">
							<h2 className="mb-3 text-base font-medium">
								Gifting product:
							</h2>

							<Input
								placeholder="Email of the receiver user"
								value={receiverEmail}
								onChange={(event) =>
									setReceiverEmail(event.target.value)
								}
								className="mb-4"
							/>
						</div>

						<div className="flex justify-end pt-2 gap-2">
							<div className="flex justify-end pt-2 gap-2">
								<Button
									type="button"
									variant="primary"
									onClick={() => {
										giftProduct.mutate({
											productId: giftingId,
											recipientEmail: receiverEmail,
										});
										setIsGifting(false);
									}}
								>
									Gift product
								</Button>

								<Button
									type="button"
									variant="secondary"
									onClick={() => setIsGifting(false)}
								>
									Back
								</Button>
							</div>
						</div>
					</Card>
				</div>
			)}{" "}
			{isGiftingWhole && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
					<Card className="w-full max-w-md p-5">
						<div className="mb-4">
							<h2 className="mb-3 text-base font-medium">
								Gifting whole fridge:
							</h2>

							<Input
								placeholder="Email of the receiver user"
								value={receiverEmailWhole}
								onChange={(event) =>
									setReceiverEmailWhole(event.target.value)
								}
								className="mb-4"
							/>
						</div>

						<div className="flex justify-end pt-2 gap-2">
							<div className="flex justify-end pt-2 gap-2">
								<Button
									type="button"
									variant="primary"
									onClick={() => {
										giftWholeFridge.mutate({
											fridgeId: giftingIdWhole,
											receiverEmail: receiverEmailWhole,
										});
										setIsGiftingWhole(false);
									}}
								>
									Gift fridge's content
								</Button>

								<Button
									type="button"
									variant="secondary"
									onClick={() => setIsGiftingWhole(false)}
								>
									Back
								</Button>
							</div>
						</div>
					</Card>
				</div>
			)}{" "}
			{isGiftingAllProducts && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
					<Card className="w-full max-w-md p-5">
						<div className="mb-4">
							<h2 className="mb-3 text-base font-medium">
								Gifting product:
							</h2>

							<Input
								placeholder="Email of the receiver user"
								value={receiverEmailAllProducts}
								onChange={(event) =>
									setReceiverEmailAllProducts(
										event.target.value,
									)
								}
								className="mb-4"
							/>
						</div>

						<div className="flex justify-end pt-2 gap-2">
							<div className="flex justify-end pt-2 gap-2">
								<Button
									type="button"
									variant="primary"
									onClick={() => {
										giftAllProducts.mutate({
											recipientEmail:
												receiverEmailAllProducts,
										});
										setIsGiftingAllProducts(false);
									}}
								>
									Gift fridge
								</Button>

								<Button
									type="button"
									variant="secondary"
									onClick={() =>
										setIsGiftingAllProducts(false)
									}
								>
									Back
								</Button>
							</div>
						</div>
					</Card>
				</div>
			)}{" "}
			{checkingDetails && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
					<Card className="w-full max-w-md p-5">
						<div className="mb-4">
							<h2 className="mb-3 text-base font-medium">
								Product Details:
							</h2>

							<ul className="list-disc list-inside space-y-2 text-sm font-normal text-slate-600">
								<li>
									<span className="font-bold">Id:</span>{" "}
									{checkedProduct.data?.id}
								</li>
								<li>
									<span className="font-bold">Name:</span>{" "}
									{checkedProduct.data?.name}
								</li>
								<li>
									<span className="font-bold">Size:</span>{" "}
									{checkedProduct.data?.size}
								</li>
								<li>
									<span className="font-bold">Type:</span>{" "}
									{checkedProduct.data?.type}
								</li>
								<li>
									<span className="font-bold">Owner Id:</span>{" "}
									{checkedProduct.data?.ownerId}
								</li>
								<li>
									<span className="font-bold">
										Fridge Id:
									</span>{" "}
									{checkedProduct.data?.fridgeId}
								</li>
								<li>
									<span className="font-bold">
										Created At:
									</span>{" "}
									{checkedProduct.data?.createdAt}
								</li>
								<li>
									<span className="font-bold">
										Updated At:
									</span>{" "}
									{checkedProduct.data?.updatedAt}
								</li>
							</ul>
						</div>

						<div className="flex justify-end pt-2 gap-2">
							<div className="flex justify-end pt-2 gap-2">
								<Button
									type="button"
									variant="danger"
									onClick={() => {
										if (checkedProduct.data) {
											deleteProduct.mutate({
												productId:
													checkedProduct.data.id,
											});
											setCheckingDetails(false);
											setCheckingId("");
										}
									}}
								>
									Delete
								</Button>

								<Button
									type="button"
									variant="secondary"
									onClick={() => setCheckingDetails(false)}
								>
									Back
								</Button>
							</div>
						</div>
					</Card>
				</div>
			)}{" "}
		</main>
	);
}
