import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsNumber, IsPositive, IsString, IsUUID } from "class-validator";

export enum ProductType {
	FOOD = "FOOD",
	DRINK = "DRINK",
}

@Exclude()
export class ProductBody {
	@ApiProperty()
	@Expose()
	@IsString()
	public name: string;

	@ApiProperty()
	@Expose()
	@IsString()
	public type: ProductType;

	@ApiProperty()
	@Expose()
	@IsNumber()
	@IsPositive()
	public size: number;
}
