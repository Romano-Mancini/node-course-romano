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
import { GiftBody } from "../../contracts/gift.body";
import { deleteProduct } from "./handlers/delete.handler";
import { getProduct } from "./handlers/get.handler";
import { getAllFridgeProducts } from "./handlers/getallfridge.handler";
import { GiftFridgeBody } from "../../contracts/gift.fridge.body";
import { giftAllFridgeProducts } from "./handlers/giftallfridge.handler";
import { deleteWholeFridge } from "./handlers/deletewholefridge.handler";

@ApiTags("fridges")
@Controller("fridges")
export class FridgeController {
	@Post()
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

	@Post(":fridgeId/products")
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({
		operationId: "putProductFridge",
		summary: "Put a user's product in a fridge",
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

	@Patch("gift")
	@ApiOperation({
		operationId: "giftProduct",
		summary: "User gifts their product to another user",
	})
	@HttpCode(HttpStatus.OK)
	@ApiSecurity("x-auth")
	@UseGuards(JwtAuthGuard)
	@ApiResponse({
		description: "Product gifted correctly",
		type: ProductView,
	})
	async giftProduct(@Body() body: GiftBody, @Req() req: any) {
		return giftProduct(req.user.userId, body.productId, body.receiverId);
	}

	@Delete(":productId")
	@ApiOperation({
		operationId: "deleteProduct",
		summary: "User deletes their product from a fridge",
	})
	@ApiSecurity("x-auth")
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@ApiResponse({
		description: "Product deleted correctly",
		type: ProductView,
	})
	async deleteProduct(
		@Param("productId") productId: string,
		@Req() req: any,
	) {
		return deleteProduct(req.user.userId, productId);
	}

	@Get(":productId")
	@ApiOperation({
		operationId: "getProduct",
		summary: "User gets one of their products",
	})
	@ApiSecurity("x-auth")
	@UseGuards(JwtAuthGuard)
	@ApiResponse({
		description: "Product correctly retrieved.",
		type: ProductView,
	})
	async getProduct(@Req() req: any, @Param("productId") productId: string) {
		return getProduct(req.user.userId, productId);
	}

	@Get(":fridgeId")
	@ApiOperation({
		operationId: "getAllProductsFromFridge",
		summary: "User gets all their products from a fridge",
	})
	@ApiSecurity("x-auth")
	@UseGuards(JwtAuthGuard)
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

	@Patch("giftAllFromFridge")
	@ApiOperation({
		operationId: "giftAllProductsFridge",
		summary: "User gifts all their products from a fridge",
	})
	@ApiSecurity("x-auth")
	@UseGuards(JwtAuthGuard)
	@ApiResponse({
		description: "Products correctly gifted.",
		type: [ProductView],
	})
	async giftAllFridgeProducts(@Req() req: any, @Body() body: GiftFridgeBody) {
		return giftAllFridgeProducts(
			req.user.userId,
			body.fridgeId,
			body.receiverId,
		);
	}

	@Delete(":fridgeId")
	@ApiOperation({
		operationId: "deleteWholeFridge",
		summary: "User deletes all their products in a fridge",
	})
	@ApiSecurity("x-auth")
	@UseGuards(JwtAuthGuard)
	@ApiResponse({
		description: "Products correctly deleted.",
	})
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteWholeFridge(
		@Req() req: any,
		@Param("fridgeId") fridgeId: string,
	) {
		deleteWholeFridge(req.user.userId, fridgeId);
	}
}
