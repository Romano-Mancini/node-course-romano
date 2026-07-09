import { Module } from "@nestjs/common";
import { UserController } from "./controllers/users/user.controller";
import { AuthController } from "./controllers/auth/auth.controller";
import { FridgeController } from "./controllers/fridge/fridge.controller";

@Module({
	controllers: [UserController, AuthController, FridgeController],
})
export class AppModule {}
