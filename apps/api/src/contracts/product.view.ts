import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import {
	IsDate,
	IsNumber,
	IsPositive,
	IsString,
	IsUUID,
} from "class-validator";

export enum ProductType {
	FOOD = "FOOD",
	DRINK = "DRINK",
}

@Exclude()
export class ProductView {
	@ApiProperty({ format: "uuid" })
	@Expose()
	@IsUUID()
	public id: string;

	@ApiProperty({ format: "uuid" })
	@Expose()
	@IsUUID()
	public fridgeId: string;

	@ApiProperty({ format: "uuid" })
	@Expose()
	@IsUUID()
	public ownerId: string;

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

	@ApiProperty({ format: "date-time" })
	@Exclude()
	@IsDate()
	public createdAt: Date;

	@ApiProperty({ format: "date-time" })
	@Exclude()
	@IsDate()
	public updatedAt: Date;
}
