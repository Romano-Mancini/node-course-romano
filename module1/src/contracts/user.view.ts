import { Exclude } from "class-transformer";
import { IsEmail, IsString, IsUUID } from "class-validator";

class UserView {
	@IsUUID()
	public id: string;

	@IsString()
	public name: string;

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
