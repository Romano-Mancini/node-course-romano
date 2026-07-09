import { Exclude, Expose } from "class-transformer";
import { IsEmail, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
class UserView {
	@ApiProperty({ format: "uuid" })
	@Expose()
	@IsUUID()
	public id: string;

	@ApiProperty()
	@Expose()
	@IsString()
	public name: string;

	@ApiProperty()
	@Expose()
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
