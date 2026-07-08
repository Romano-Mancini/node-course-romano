import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class SearchQuery {
	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	public search?: string;
}
