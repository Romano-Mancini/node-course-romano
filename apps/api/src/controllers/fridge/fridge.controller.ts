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

	@Post(":fridgeId")
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
	@ApiResponse({
		description: "Product deleted correctly",
		type: ProductView,
	})
	async deleteProduct(@Body() body: GiftBody, @Req() req: any) {
		return deleteProduct(req.user.userId, body.productId);
	}
}
