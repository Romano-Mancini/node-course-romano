import { Exclude } from "class-transformer";
import { IsEmail, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
class UserView {
	@ApiProperty({ format: "uuid" })
	@IsUUID()
	public id: string;

	@ApiProperty()
	@IsString()
	public name: string;

	@ApiProperty()
	@IsEmail()
	public email: string;

	@Exclude()
	public password: string;

	@Exclude()
	public createdAt: Date;

	@Exclude()
	public updatedAt: Date;
}

export { UserView };
