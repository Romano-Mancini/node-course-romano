import { IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AccessTokenView {
	@ApiProperty()
	@IsString()
	public token: string;

	@ApiProperty()
	@IsNumber()
	public expiresIn: number;
}
