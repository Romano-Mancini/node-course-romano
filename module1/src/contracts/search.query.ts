import { IsString, IsOptional } from "class-validator";

export class SearchQuery {
	@IsString()
	@IsOptional()
	public search?: string;
}
