import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  resendVerificationSchema,
  updateProfileSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), AuthController.resendVerification);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);
router.put('/profile', authenticate, validate(updateProfileSchema), AuthController.updateProfile);

export default router;
