import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsArray, IsOptional, IsString } from "class-validator";

@Exclude()
export class UpdateBody {
	@ApiProperty()
	@Expose()
	@IsString()
	@IsOptional()
	public description: string;

	@ApiProperty()
	@Expose()
	@IsArray()
	@IsOptional()
	public ingredients: string[];
}
