import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsNumber, IsPositive, IsString, IsUUID } from "class-validator";

@Exclude()
export class FridgeView {
	@ApiProperty({ format: "uuid" })
	@Expose()
	@IsUUID()
	public id: string;

	@ApiProperty()
	@Expose()
	@IsString()
	public email: string;

	@ApiProperty()
	@Expose()
	@IsNumber()
	@IsPositive()
	public capacity: number;
}
