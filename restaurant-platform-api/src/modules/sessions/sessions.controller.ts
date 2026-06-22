import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { Public } from '../../common/decorators';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Public()
  @Post('scan')
  @ApiOperation({ summary: 'Validate QR token and create customer session' })
  async scan(@Body() body: { token: string; deviceFingerprint?: string }) {
    return this.sessionsService.createFromQrScan(body.token, body.deviceFingerprint);
  }
}
