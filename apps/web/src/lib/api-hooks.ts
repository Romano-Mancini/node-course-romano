"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFridge,
	createRecipe,
	createUser,
	deleteAllProducts,
	deleteProduct,
	deleteUser,
	deleteUserRecipe,
	deleteWholeFridge,
	FridgeBody,
	getAllProducts,
	getAllProductsFromFridge,
	getAllProductsInLocation,
	getMissingIngredients,
	getProduct,
	getUserRecipes,
	getUserRecipes2,
	giftAllProducts,
	giftAllProductsFridge,
	giftProduct,
	listUsers,
	login,
	ProductBody,
	putProductFridge,
	RecipeBody,
	UpdateBody,
	updateUser,
	updateUserRecipe,
	type UserBody,
} from "@node-course/api-sdk";

const USERS_KEY = ["users"];
const FRIDGE_KEY = ["fridges"];
const RECIPE_KEY = ["recipes"];

// Every hook calls a typed SDK function, checks the `{ data, error }` result,
// and lets TanStack Query handle loading/error/caching state.
export function useUsers(search: string) {
	return useQuery({
		queryKey: [...USERS_KEY, search],
		queryFn: async () => {
			const { data, error } = await listUsers({
				query: search ? { search } : undefined,
			});
			if (error) throw error;
			return data ?? [];
		},
	});
}

export function useLogin() {
	return useMutation({
		mutationFn: async (body: { email: string; password: string }) => {
			const { data, error } = await login({ body });
			if (error) throw error;
			return data!;
		},
	});
}

export function useCreateUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (body: UserBody) => {
			const { data, error } = await createUser({ body });
			if (error) throw error;
			return data!;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
	});
}

export function useUpdateUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, body }: { id: string; body: UserBody }) => {
			const { data, error } = await updateUser({ path: { id }, body });
			if (error) throw error;
			return data!;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
	});
}

export function useDeleteUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await deleteUser({ path: { id } });
			if (error) throw error;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
	});
}

export function useCreateFridge() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (body: FridgeBody) => {
			const { data, error } = await createFridge({ body });
			if (error) throw error;
			return data!;
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: FRIDGE_KEY }),
	});
}

export function useFridgeProducts(fridgeId: string) {
	return useQuery({
		queryKey: [...FRIDGE_KEY, fridgeId],
		queryFn: async () => {
			const { data, error } = await getAllProductsFromFridge({
				path: {
					fridgeId,
				},
			});

			if (error) throw error;
			return data!;
		},
	});
}

export function useAddProductToFridge() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			body,
			fridgeId,
		}: {
			body: ProductBody;
			fridgeId: string;
		}) => {
			const { data, error } = await putProductFridge({
				path: { fridgeId },
				body,
			});

			if (error) throw error;
			return data!;
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: FRIDGE_KEY }),
	});
}

export function useDeleteWholeFridge() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ fridgeId }: { fridgeId: string }) => {
			const { data, error } = await deleteWholeFridge({
				path: { fridgeId },
			});

			if (error) throw error;
			return data!;
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: FRIDGE_KEY }),
	});
}

export function useGiftAllProductsFromFridge() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			fridgeId,
			receiverEmail,
		}: {
			fridgeId: string;
			receiverEmail: string;
		}) => {
			const { data, error } = await giftAllProductsFridge({
				path: { fridgeId, receiverEmail },
			});

			if (error) throw error;
			return data!;
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: FRIDGE_KEY }),
	});
}

export function useGetProducts() {
	return useQuery({
		queryKey: [...FRIDGE_KEY],
		queryFn: async () => {
			const { data, error } = await getAllProducts({});

			if (error) throw error;
			return data!;
		},
	});
}

export function useProductsByLocation(location: string) {
	return useQuery({
		queryKey: [...FRIDGE_KEY, location],
		queryFn: async () => {
			const { data, error } = await getAllProductsInLocation({
				path: { location },
			});

			if (error) throw error;
			return data!;
		},
	});
}

export function useProduct(productId: string) {
	return useQuery({
		queryKey: [...FRIDGE_KEY, productId],
		queryFn: async () => {
			const { data, error } = await getProduct({
				path: { productId },
			});

			if (error) throw error;
			return data!;
		},
	});
}

export function useDeleteProduct() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ productId }: { productId: string }) => {
			const { data, error } = await deleteProduct({
				path: { productId },
			});

			if (error) throw error;
			return data!;
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: FRIDGE_KEY }),
	});
}

export function useDeleteAllProducts() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const { data, error } = await deleteAllProducts({});

			if (error) throw error;
			return data!;
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: FRIDGE_KEY }),
	});
}

export function useGiftProduct() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			productId,
			recipientEmail,
		}: {
			productId: string;
			recipientEmail: string;
		}) => {
			const { data, error } = await giftProduct({
				path: {
					productId,
					recipientEmail,
				},
			});

			if (error) throw error;
			return data!;
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: FRIDGE_KEY }),
	});
}

export function useGiftAllProducts() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ recipientEmail }: { recipientEmail: string }) => {
			const { data, error } = await giftAllProducts({
				path: {
					recipientEmail,
				},
			});

			if (error) throw error;
			return data!;
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: FRIDGE_KEY }),
	});
}

export function useRecipes() {
	return useQuery({
		queryKey: [...RECIPE_KEY],
		queryFn: async () => {
			const { data, error } = await getUserRecipes({});

			if (error) throw error;
			return data!;
		},
	});
}

export function useRecipe(recipeName: string) {
	return useQuery({
		queryKey: [...RECIPE_KEY, recipeName],
		queryFn: async () => {
			const { data, error } = await getUserRecipes2({
				path: { recipeName },
			});

			if (error) throw error;
			return data!;
		},
	});
}

export function useCreateRecipe() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ body }: { body: RecipeBody }) => {
			const { data, error } = await createRecipe({ body });

			if (error) throw error;
			return data!;
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: RECIPE_KEY }),
	});
}

export function useUpdateRecipe() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			recipeName,
			body,
		}: {
			recipeName: string;
			body: UpdateBody;
		}) => {
			const { data, error } = await updateUserRecipe({
				path: { recipeName },
				body,
			});

			if (error) throw error;
			return data!;
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: RECIPE_KEY }),
	});
}

export function useDeleteRecipe() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ recipeName }: { recipeName: string }) => {
			const { data, error } = await deleteUserRecipe({
				path: { recipeName },
			});

			if (error) throw error;
			return data!;
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: RECIPE_KEY }),
	});
}

export function useMissingIngredients(recipeName: string) {
	return useQuery({
		queryKey: [...RECIPE_KEY, recipeName],
		queryFn: async () => {
			const { data, error } = await getMissingIngredients({
				path: { recipeName },
			});

			if (error) throw error;
			return data!;
		},
	});
}
