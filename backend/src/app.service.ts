import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Clean Motion Ghana - CSMS API - Central System Management System';
  }
}



