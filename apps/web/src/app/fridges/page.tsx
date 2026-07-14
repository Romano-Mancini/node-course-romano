"use client";

import { useState } from "react";
import Link from "next/link";

import { useCreateFridge, useAllFridges } from "@/lib/api-hooks";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function FridgesPage() {
	const [location, setLocation] = useState("");
	const [capacity, setCapacity] = useState("");

	const fridgesQuery = useAllFridges();
	const createFridge = useCreateFridge();

	return (
		<main className="mx-auto max-w-3xl px-4 py-10">
			<h1 className="text-2xl font-semibold mb-6">My Fridges</h1>

			<Card className="p-6 mb-6">
				<h2 className="font-semibold mb-4">Create fridge</h2>

				<Input
					placeholder="Location"
					value={location}
					onChange={(e) => setLocation(e.target.value)}
				/>

				<Input
					className="mt-2"
					type="number"
					placeholder="Capacity"
					value={capacity}
					onChange={(e) => setCapacity(e.target.value)}
				/>

				<Button
					className="mt-4"
					onClick={() => {
						createFridge.mutate({
							location,
							capacity: Number(capacity),
						});
					}}
				>
					Create fridge
				</Button>
			</Card>

			<Card className="p-6">
				<h2 className="font-semibold mb-4">Your fridges</h2>

				{fridgesQuery.isLoading && <p>Loading...</p>}

				{(fridgesQuery.data ?? []).map((fridge) => (
					<div key={fridge.id} className="border-b py-4">
						<p className="font-medium">Fridge ID: {fridge.id}</p>

						<p className="text-sm text-slate-500">
							Location: {fridge.location}
							<br />
							Capacity: {fridge.capacity}
						</p>

						<Link href={`/fridges/${fridge.id}`}>
							<Button className="mt-3">Open fridge</Button>
						</Link>
					</div>
				))}
			</Card>
		</main>
	);
}
