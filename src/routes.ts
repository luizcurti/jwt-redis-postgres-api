import { Router } from 'express';
import { CreateUserController } from './controllers/CreateUserController';
import { GetUserInfoController } from './controllers/GetUserInfoController';
import { LoginUserController } from './controllers/LoginUserController';
import { authentication } from './middleware/auth';
import { pool } from './postgres';
import { redisClient } from './redisConfig';
import { CacheRepository } from './repositories/CacheRepository';
import { UserRepository } from './repositories/UserRepository';
import { AuthService } from './services/AuthService';
import { TokenService } from './services/TokenService';
import { UserService } from './services/UserService';

const userRepository = new UserRepository(pool);
const cacheRepository = new CacheRepository(redisClient);
const tokenService = new TokenService();

const userService = new UserService(userRepository, cacheRepository);
const authService = new AuthService(
  userRepository,
  cacheRepository,
  tokenService
);

const createUserController = new CreateUserController(userService);
const loginUserController = new LoginUserController(authService);
const getUserInfoController = new GetUserInfoController(userService);

const router = Router();

router.post('/users', createUserController.handle);
router.post('/login', loginUserController.handle);
router.get('/users/profile/:id', authentication, getUserInfoController.handle);

export default router;
