import { Exclude, Expose } from "class-transformer";
import { IsEmail, IsOptional, IsString, Length } from "class-validator";

// Exclude every property from being transformed unless specifically exposed
@Exclude()
class UserBody {
	// We can expose the properties we want included one by one
	@Expose()
	@IsString()
	@IsOptional()
	public name: string;

	@Expose()
	@IsEmail()
	@IsOptional()
	public email: string;

	@Expose()
	@IsString()
	@Length(8)
	@IsOptional()
	public password: string;
}

export { UserBody };
