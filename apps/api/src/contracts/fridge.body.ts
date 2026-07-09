import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsNumber, IsPositive, IsString } from "class-validator";

@Exclude()
export class FridgeBody {
	@ApiProperty()
	@Expose()
	@IsString()
	public location: string;

	@ApiProperty()
	@Expose()
	@IsNumber()
	@IsPositive()
	public capacity: number;
}
