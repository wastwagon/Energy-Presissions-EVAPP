import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'CSMS API - Central System Management System for EV Charging Billing';
  }
}



