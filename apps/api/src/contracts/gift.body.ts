import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsEmail, IsString } from "class-validator";

Exclude();
export class GiftBody {
	@ApiProperty()
	@IsEmail()
	@Expose()
	public productId: string;

	@ApiProperty()
	@IsString()
	@Expose()
	public receiverId: string;
}
