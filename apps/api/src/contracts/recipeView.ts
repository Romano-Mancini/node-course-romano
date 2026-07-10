import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsArray, IsNumber, IsString, IsUUID } from "class-validator";

@Exclude()
export class RecipeView {
	@ApiProperty()
	@Expose()
	@IsString()
	public name: string;

	@ApiProperty()
	@Expose()
	@IsString()
	public description: string;

	@ApiProperty({ format: "uuid" })
	@Expose()
	@IsUUID()
	public id: string;

	@ApiProperty()
	@Expose()
	@IsUUID()
	public ownerId: string;

	@ApiProperty()
	@Expose()
	@IsArray()
	public ingredients: string[];
}
