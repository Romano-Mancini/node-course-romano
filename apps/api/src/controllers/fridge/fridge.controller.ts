import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";
import {
	ApiOperation,
	ApiResponse,
	ApiSecurity,
	ApiTags,
} from "@nestjs/swagger";
import { FridgeView } from "../../contracts/fridge.view";
import { FridgeBody } from "../../contracts/fridge.body";
import { create } from "./handlers/create.handler";
import { JwtAuthGuard } from "../../guards/jsw-auth.guard";
import { putProduct } from "./handlers/putproduct.handler";
import { ProductBody } from "../../contracts/product.body";
import { giftProduct } from "./handlers/gift.handler";
import { ProductView } from "../../contracts/product.view";
import { deleteProduct } from "./handlers/delete.handler";
import { getProduct } from "./handlers/get.handler";
import { getAllFridgeProducts } from "./handlers/getallfridge.handler";
import { giftAllFridgeProducts } from "./handlers/giftallfridge.handler";
import { deleteWholeFridge } from "./handlers/deletewholefridge.handler";
import { getAllProducts } from "./handlers/getallproducts.handler";
import { giftAllProducts } from "./handlers/giftallproducts.handler";
import { deleteAllProducts } from "./handlers/deleteall.handler";
import { getFromLocation } from "./handlers/getfromlocation.handler";
import { RecipeBody } from "../../contracts/recipeBody";
import { createRecipe } from "./handlers/create.recipe.handler";
import { deleteRecipe } from "./handlers/delete.recipe.handler";
import { changeRecipe } from "./handlers/change.recipe";
import { UpdateBody } from "../../contracts/update.body";
import { getAllRecipes } from "./handlers/getall.recipe";
import { getRecipe } from "./handlers/get.recipe";
import { getMissingIngredients } from "./handlers/getmissing.recipe";

@ApiTags("fridges")
@Controller()
export class FridgeController {
	@Post("fridges")
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "createFridge",
		summary: "Create a new fridge",
	})
	@ApiResponse({
		status: 201,
		description: "Fridge created successfully",
		type: FridgeView,
	})
	async create(@Body() body: FridgeBody) {
		return create(body);
	}

	@Post("fridges/:fridgeId/products")
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "putProductFridge",
		summary: "Put a product in a fridge",
	})
	@ApiResponse({
		status: 201,
		description: "Product stored successfully",
	})
	async putProduct(
		@Param("fridgeId") fridgeId: string,
		@Req() req: any,
		@Body() body: ProductBody,
	) {
		return putProduct(req.user.userId, fridgeId, body);
	}

	@Get("fridges/:fridgeId/products")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "getAllProductsFromFridge",
		summary: "Get all user's products from a fridge",
	})
	@ApiResponse({
		description: "Products correctly retrieved.",
		type: [ProductView],
	})
	async getAllFridgeProducts(
		@Req() req: any,
		@Param("fridgeId") fridgeId: string,
	) {
		return getAllFridgeProducts(req.user.userId, fridgeId);
	}

	@Patch("fridges/:fridgeId/products/gift/:recipientId")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "giftAllProductsFridge",
		summary: "Gift all products from a fridge",
	})
	@ApiResponse({
		description: "Products correctly gifted.",
	})
	async giftAllFridgeProducts(
		@Req() req: any,
		@Param("fridgeId") fridgeId: string,
		@Param("recipientId") recipientId: string,
	) {
		return giftAllFridgeProducts(req.user.userId, fridgeId, recipientId);
	}

	@Delete("fridges/:fridgeId/products")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "deleteWholeFridge",
		summary: "Delete all user's products from a fridge",
	})
	@ApiResponse({
		description: "Products correctly deleted.",
	})
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteWholeFridge(
		@Req() req: any,
		@Param("fridgeId") fridgeId: string,
	) {
		return deleteWholeFridge(req.user.userId, fridgeId);
	}

	@Get("products")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "getAllProducts",
		summary: "Get all user's products",
	})
	@ApiResponse({
		description: "Products correctly retrieved.",
		type: [ProductView],
	})
	async getAllProducts(@Req() req: any) {
		return getAllProducts(req.user.userId);
	}

	@Get("products/:productId")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "getProduct",
		summary: "Get one of the user's products",
	})
	@ApiResponse({
		description: "Product correctly retrieved.",
		type: ProductView,
	})
	async getProduct(@Req() req: any, @Param("productId") productId: string) {
		return getProduct(req.user.userId, productId);
	}

	@Patch("products/:productId/gift/:recipientId")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "giftProduct",
		summary: "Gift a product to another user",
	})
	@ApiResponse({
		description: "Product gifted correctly",
		type: ProductView,
	})
	async giftProduct(
		@Req() req: any,
		@Param("productId") productId: string,
		@Param("recipientId") recipientId: string,
	) {
		return giftProduct(req.user.userId, productId, recipientId);
	}

	@Delete("products/:productId")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "deleteProduct",
		summary: "Delete a product",
	})
	@ApiResponse({
		description: "Product deleted correctly",
		type: ProductView,
	})
	@HttpCode(HttpStatus.OK)
	async deleteProduct(
		@Req() req: any,
		@Param("productId") productId: string,
	) {
		return deleteProduct(req.user.userId, productId);
	}

	@Patch("products/gift/:recipientId")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "giftAllProducts",
		summary: "Gift all products to another user",
	})
	@ApiResponse({
		description: "Products correctly transferred.",
	})
	async giftAllProducts(
		@Req() req: any,
		@Param("recipientId") recipientId: string,
	) {
		return giftAllProducts(req.user.userId, recipientId);
	}

	@Delete("products")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "deleteAllProducts",
		summary: "Delete all user's products",
	})
	@ApiResponse({
		description: "Products correctly deleted.",
	})
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteAllProducts(@Req() req: any) {
		return deleteAllProducts(req.user.userId);
	}

	@Get("products")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "getAllProductsInLocation",
		summary:
			"Get all user's products from all fridges in a certain location",
	})
	@ApiResponse({
		description: "Products correctly deleted.",
	})
	@HttpCode(HttpStatus.OK)
	async getFromLocation(
		@Req() req: any,
		@Query("location") location: string,
	) {
		return getFromLocation(req.user.userId, location);
	}

	@Post("recipes")
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "createRecipe",
		summary: "User creates a recipe",
	})
	@ApiResponse({
		description: "Recipe correctly created.",
	})
	@HttpCode(HttpStatus.OK)
	async createRecipe(@Req() req: any, @Body() body: RecipeBody) {
		return createRecipe(body, req.user.userId);
	}

	@Delete("recipes/:recipeName")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "deleteUserRecipe",
		summary: "Delete a user's recipe",
	})
	@ApiResponse({
		description: "Recipe correctly deleted.",
	})
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteRecipe(
		@Req() req: any,
		@Param("recipeName") recipeName: string,
	) {
		return deleteRecipe(recipeName, req.user.userId);
	}

	@Patch("recipes/:recipeName")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "updateUserRecipe",
		summary: "Update a user's recipe",
	})
	@ApiResponse({
		description: "Recipe correctly updated.",
	})
	@HttpCode(HttpStatus.OK)
	async changeRecipe(
		@Req() req: any,
		@Param("recipeName") recipeName: string,
		@Body() body: UpdateBody,
	) {
		return changeRecipe(body, req.user.userId, recipeName);
	}

	@Get("recipes")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "getUserRecipes",
		summary: "User gets all their recipes",
	})
	@ApiResponse({
		description: "Recipe correctly updated.",
	})
	@HttpCode(HttpStatus.OK)
	async getAllRecipes(@Req() req: any) {
		return getAllRecipes(req.user.userId);
	}

	@Get("recipes/:recipeName")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "getUserRecipes",
		summary: "User gets all their recipes",
	})
	@ApiResponse({
		description: "Recipe correctly updated.",
	})
	@HttpCode(HttpStatus.OK)
	async getRecipe(@Param("recipeName") recipeName: string, @Req() req: any) {
		return getRecipe(req.user.userId, recipeName);
	}

	@Get("recipes/missingIngredients/:recipeName")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "getMissingIngredients",
		summary: "User gets the ingredients it misses for one of its recipes",
	})
	@ApiResponse({
		description: "Missing ingredients correctly fetched.",
	})
	@HttpCode(HttpStatus.OK)
	async getMissingIngredients(
		@Param("recipeName") recipeName: string,
		@Req() req: any,
	) {
		return getMissingIngredients(req.user.userId, recipeName);
	}
}
