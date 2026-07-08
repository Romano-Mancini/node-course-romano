import { Module } from "@nestjs/common";
import { UserController } from "./controllers/users/user.controller";
import { AuthController } from "./controllers/auth/auth.controller";

@Module({
	controllers: [UserController, AuthController],
})
export class AppModule {}
