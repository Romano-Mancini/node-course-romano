import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsString, IsUUID } from "class-validator";

Exclude();
export class GiftFridgeBody {
	@ApiProperty({ format: "uuid" })
	@IsUUID()
	@Expose()
	public fridgeId: string;

	@ApiProperty({ format: "uuid" })
	@IsString()
	@Expose()
	public receiverId: string;
}
