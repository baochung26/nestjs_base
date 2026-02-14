import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const google = configService.get('google');
    super({
      clientID: google?.clientId || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret:
        google?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: google?.callbackURL || process.env.GOOGLE_CALLBACK_URL || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    if (!profile) {
      return done(new Error('Google profile is missing'), false);
    }

    const { name, emails, photos } = profile;

    if (!emails?.[0]?.value) {
      return done(new Error('Google email is missing'), false);
    }

    const user = {
      email: emails[0].value,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}
