import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context, status) {

    if (info instanceof Error && info.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token has expired. Please log in again.');
    }

    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
