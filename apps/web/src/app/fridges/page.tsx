"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { UserView } from "@node-course/api-sdk";

import {
	useAllFridges,
	useCreateUser,
	useDeleteUser,
	useGetFridge,
	useGetProducts,
	useUpdateUser,
	useUsers,
} from "@/lib/api-hooks";

import { clearToken, isAuthenticated } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserForm } from "@/components/user-form";

type Editing = { mode: "create" } | { mode: "edit"; user: UserView } | null;

export default function FridgePage() {
	const router = useRouter();

	const [authChecked, setAuthChecked] = useState(false);

	const [search, setSearch] = useState("");

	const [editing, setEditing] = useState<Editing>(null);

	useEffect(() => {
		if (!isAuthenticated()) {
			router.replace("/login");
		} else {
			setAuthChecked(true);
		}
	}, [router]);

	const products = useGetProducts();
	const fridges = useAllFridges();

	useEffect(() => {
		console.log("useEffect:", products.data);
		console.log("useEffect on fridges:", fridges.data);
	});

	const fridgeMap = new Map(
		fridges.data?.map((fridge) => [fridge.id, fridge.location]) ?? [],
	);

	console.log("Products", products.data);
	console.log("fridges", fridges.data);
	console.log("fridgeMap", fridgeMap);

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
						<Button>Fridge</Button>
					</Link>

					<Button onClick={() => setEditing({ mode: "create" })}>
						New user
					</Button>

					<Button variant="ghost" onClick={logout}>
						Log out
					</Button>
				</div>
			</header>

			<Input
				placeholder="Search by name or email…"
				value={search}
				onChange={(event) => setSearch(event.target.value)}
				className="mb-4"
			/>

			<Card className="divide-y divide-slate-100">
				{products.isLoading && (
					<p className="p-4 text-sm text-slate-500">Loading…</p>
				)}

				{products.isError && (
					<p className="p-4 text-sm text-red-600">
						Failed to load users.
					</p>
				)}

				{products.data?.length === 0 && (
					<p className="p-4 text-sm text-slate-500">
						No users found.
					</p>
				)}

				{products.data?.map((product) => (
					<div
						key={product.id}
						className="flex items-center justify-between p-4"
					>
						<div>
							<p className="font-medium">
								Fridge Location:{" "}
								{fridgeMap.get(product.fridgeId) ?? "Unknown"}
							</p>
							<p className="font-medium">
								Product Name: {product.name}
							</p>
						</div>
					</div>
				))}
			</Card>
		</main>
	);
}
