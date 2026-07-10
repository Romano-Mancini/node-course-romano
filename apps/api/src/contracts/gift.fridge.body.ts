import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsString, IsUUID } from "class-validator";

Exclude();
export class GiftFridgeBody {
	@ApiProperty()
	@IsUUID()
	@Expose()
	public fridgeId: string;

	@ApiProperty()
	@IsString()
	@Expose()
	public receiverId: string;
}
