import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegistrationResponseDTO } from './dto/registration-response.dto';
import { RegistrationDTO } from './dto/registration.dto';
import { SignInByPasswordDTO } from './dto/sign-in-by-password.dto';
import { SignInResponseDTO } from './dto/sign-in-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth_service: AuthService) {}

  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegistrationDTO, required: true })
  @ApiOkResponse({ isArray: false, type: RegistrationResponseDTO })
  @Post('registration')
  public async registration(@Body() body: RegistrationDTO) {
    return this.auth_service.registration(
      body.email,
      body.username,
      body.password,
    );
  }

  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: SignInByPasswordDTO, required: true })
  @Post('login')
  public async login(
    @Body() body: SignInByPasswordDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth_service.login(body.email, body.password);

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 20 * 60 * 1000,
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Login successful',
    };
  }

  @ApiOperation({ summary: 'Logout user' })
  @Post('logout')
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refresh_token = req.cookies['refresh_token'];
    if (!refresh_token) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No refresh token found in cookies',
      };
    }

    await this.auth_service.logout(refresh_token);

    res.clearCookie('access_token', { httpOnly: true, secure: true });
    res.clearCookie('refresh_token', { httpOnly: true, secure: true });

    return { message: 'Logout successful' };
  }

  @ApiOperation({ summary: 'Obtain access token using refresh token' })
  @ApiOkResponse({ type: SignInResponseDTO, isArray: false })
  @ApiBody({
    description:
      'This endpoint uses the refresh token stored in cookies to generate a new access token.',
  })
  @Post('refresh-token')
  public async refreshToken(@Req() req: Request) {
    const refresh_token = req.cookies['refresh_token'];

    if (!refresh_token) {
      throw new Error('Refresh token not found in cookies');
    }

    return this.auth_service.refreshAccessToken(refresh_token);
  }
}
