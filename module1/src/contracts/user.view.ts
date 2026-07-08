import { Exclude, Expose } from "class-transformer";
import { IsEmail, IsString, IsUUID } from "class-validator";

@Exclude()
class UserView {
	@Expose()
	@IsUUID()
	public id: number;

	@Expose()
	@IsString()
	public name: string;

	@Expose()
	@IsEmail()
	public email: string;
}

export { UserView };
