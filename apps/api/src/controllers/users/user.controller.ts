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
	@ApiOperation({ summary: "Create a new user" })
	@ApiResponse({ status: 201, description: "User created successfully" })
	async create(@Body() body: UserBody) {
		return create(body);
	}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Get all users" })
	@ApiResponse({ status: 200, description: "Users retrieved successfully" })
	async getList(@Query() query: SearchQuery): Promise<UserView[]> {
		return getList(query.search);
	}

	@Get(":id")
	@UseGuards(JwtAuthGuard)
	async get(@Param("id") id: string) {
		return get(id);
	}

	@SerializeOptions({ type: UserView })
	@Patch(":id")
	@UseGuards(JwtAuthGuard)
	async update(
		@Param("id") id: string,
		@Body() body: UserBody,
	): Promise<UserView> {
		return update(id, body);
	}

	@Delete(":id")
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async delete(@Param("id") id: string) {
		await deleteUser(id);
	}
}
