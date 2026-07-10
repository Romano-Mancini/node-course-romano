import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsArray, IsNumber, IsPositive, IsString } from "class-validator";

@Exclude()
export class RecipeBody {
	@ApiProperty()
	@Expose()
	@IsString()
	public name: string;

	@ApiProperty()
	@Expose()
	@IsString()
	public description: string;

	@ApiProperty()
	@Expose()
	@IsArray()
	public ingredients: string[];
}
