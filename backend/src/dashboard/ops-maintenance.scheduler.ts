import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DashboardService } from './dashboard.service';

@Injectable()
export class OpsMaintenanceScheduler {
  private readonly logger = new Logger(OpsMaintenanceScheduler.name);
  private running = false;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runScheduledMaintenance(): Promise<void> {
    if (this.config.get<string>('OPS_MAINTENANCE_ENABLED') === 'false') {
      return;
    }
    if (this.running) {
      this.logger.warn('Skipping scheduled ops maintenance — previous run still in progress');
      return;
    }

    const releaseWalletHours = parseInt(
      this.config.get<string>('OPS_MAINTENANCE_RELEASE_WALLET_HOURS') || '48',
      10,
    );
    const sweepConnectorMinutes = parseInt(
      this.config.get<string>('OPS_MAINTENANCE_SWEEP_CONNECTOR_MINUTES') || '30',
      10,
    );

    this.running = true;
    try {
      const result = await this.dashboardService.runOpsMaintenance({
        releaseWalletHours: Number.isFinite(releaseWalletHours) ? releaseWalletHours : 48,
        sweepConnectorMinutes: Number.isFinite(sweepConnectorMinutes)
          ? sweepConnectorMinutes
          : 30,
      });
      if (
        result.walletHoldsReleased > 0 ||
        result.sweep.connectorsCleared > 0
      ) {
        this.logger.log(
          `Scheduled maintenance: ${result.walletHoldsReleased} wallet hold(s), ${result.sweep.connectorsCleared} connector(s) on ${result.sweep.chargePointIds.length} device(s)`,
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Scheduled ops maintenance failed: ${message}`);
    } finally {
      this.running = false;
    }
  }
}
