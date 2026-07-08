import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	Query,
	HttpCode,
	HttpStatus,
	UseGuards,
	SerializeOptions,
	UseInterceptors,
	ClassSerializerInterceptor,
} from "@nestjs/common";

import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiSecurity,
} from "@nestjs/swagger";

import { SearchQuery } from "../../contracts/search.query";
import { UserBody } from "../../contracts/user.body";
import { create } from "./handlers/create.handler";
import { deleteUser } from "./handlers/delete.handler";
import { get } from "./handlers/get.handler";
import { getList } from "./handlers/getList.handler";
import { update } from "./handlers/update.handler";
import { UserView } from "../../contracts/user.view";
import { JwtAuthGuard } from "../../guards/jsw-auth.guard";
import { Transform } from "class-transformer";

@ApiTags("users")
@Controller("users")
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		operationId: "createUser",
		summary: "Create a new user",
	})
	@ApiResponse({
		status: 201,
		description: "User created successfully",
		type: UserView,
	})
	async create(@Body() body: UserBody) {
		return create(body);
	}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({ operationId: "listUsers", summary: "Get all users" })
	@ApiResponse({
		status: 200,
		description: "Users retrieved successfully",
		type: UserView,
		isArray: true,
	})
	async getList(@Query() query: SearchQuery): Promise<UserView[]> {
		return getList(query.search) as unknown as UserView[];
	}

	@Get(":id")
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ operationId: "retrieveUser", summary: "Get user by id" })
	@ApiResponse({
		status: 200,
		description: "User retrieved successfully",
		type: UserView,
	})
	async get(@Param("id") id: string) {
		return get(id);
	}

	@SerializeOptions({ type: UserView })
	@Patch(":id")
	@ApiOperation({
		operationId: "updateUser",
		summary: "Update a user",
	})
	@UseGuards(JwtAuthGuard)
	@ApiResponse({
		description: "User updated successfully",
		type: UserView,
	})
	async update(
		@Param("id") id: string,
		@Body() body: UserBody,
	): Promise<UserView> {
		return update(id, body);
	}

	@Delete(":id")
	@ApiOperation({ operationId: "deleteUser", summary: "Delete a user" })
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async delete(@Param("id") id: string) {
		await deleteUser(id);
	}
}
