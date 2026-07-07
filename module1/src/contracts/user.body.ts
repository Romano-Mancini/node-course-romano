import { Exclude, Expose } from "class-transformer";
import { IsEmail, IsString, Length } from "class-validator";

// Exclude every property from being transformed unless specifically exposed
@Exclude()
class UserBody {
	// We can expose the properties we want included one by one
	@Expose()
	@IsString()
	public name: string;

	@Expose()
	@IsEmail()
	public email: string;

	@Expose()
	@IsString()
	@Length(8)
	public password: string;
}

export { UserBody };
