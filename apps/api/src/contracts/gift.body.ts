import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsString, IsUUID } from "class-validator";

Exclude();
export class GiftBody {
	@ApiProperty({ format: "uuid" })
	@IsUUID()
	@Expose()
	public productId: string;

	@ApiProperty({ format: "uuid" })
	@IsString()
	@Expose()
	public receiverId: string;
}
