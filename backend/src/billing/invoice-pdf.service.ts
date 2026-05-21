import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Invoice } from '../entities/invoice.entity';
import { Transaction } from '../entities/transaction.entity';
import { Vendor } from '../entities/vendor.entity';
import { User } from '../entities/user.entity';

export type InvoicePdfLogo = {
  buffer: Buffer;
  mime: string;
};

export type InvoicePdfBranding = {
  businessName: string;
  locationLine?: string | null;
  headerText?: string | null;
  footerText?: string | null;
  address?: string | null;
  supportLine?: string | null;
  customerName?: string | null;
  logo?: InvoicePdfLogo | null;
};

@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger(InvoicePdfService.name);

  buildBranding(
    transaction: Transaction & { chargePoint?: { vendor?: Vendor; locationAddress?: string } },
    user?: User | null,
  ): InvoicePdfBranding {
    const vendor = transaction.chargePoint?.vendor;
    const vendorName = vendor?.name ?? null;
    const customerName = user
      ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email
      : null;

    const supportParts = [
      vendor?.supportEmail ?? vendor?.contactEmail,
      vendor?.supportPhone ?? vendor?.contactPhone,
    ].filter(Boolean);

    return {
      businessName: vendor?.businessName?.trim() || vendorName || 'Clean Motion Ghana',
      locationLine:
        transaction.chargePoint?.locationAddress?.trim() ||
        transaction.chargePointId ||
        null,
      headerText: vendor?.receiptHeaderText ?? null,
      footerText: vendor?.receiptFooterText ?? null,
      address: vendor?.address?.trim() || null,
      supportLine: supportParts.length > 0 ? supportParts.join(' · ') : null,
      customerName,
    };
  }

  async buildInvoicePdfBuffer(
    invoice: Invoice,
    transaction: Transaction,
    branding: InvoicePdfBranding,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 48, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const currency = invoice.currency || 'GHS';
        const margin = 48;
        const logoBox = 72;
        let headerTextY = margin;

        if (branding.logo?.buffer?.length) {
          try {
            doc.image(branding.logo.buffer, margin, margin, {
              fit: [logoBox, logoBox],
            });
            headerTextY = margin;
            const textX = margin + logoBox + 14;
            const textWidth = doc.page.width - margin - textX;
            doc.fontSize(18).fillColor('#000000').text(branding.businessName, textX, headerTextY, {
              width: textWidth,
            });
            let subY = doc.y + 4;
            doc.fontSize(10).fillColor('#444444');
            if (branding.locationLine) {
              doc.text(branding.locationLine, textX, subY, { width: textWidth });
              subY = doc.y;
            }
            if (branding.address) {
              doc.text(branding.address, textX, subY, { width: textWidth });
            }
            doc.fillColor('#000000');
            doc.y = Math.max(doc.y, margin + logoBox);
          } catch (imgErr) {
            this.logger.warn('Invoice PDF logo skipped', imgErr);
            doc.fontSize(18).text(branding.businessName, { continued: false });
            doc.moveDown(0.25);
            doc.fontSize(10).fillColor('#444444');
            if (branding.locationLine) doc.text(branding.locationLine);
            if (branding.address) doc.text(branding.address);
            doc.fillColor('#000000');
          }
        } else {
          doc.fontSize(18).text(branding.businessName, { continued: false });
          doc.moveDown(0.25);
          doc.fontSize(10).fillColor('#444444');
          if (branding.locationLine) {
            doc.text(branding.locationLine);
          }
          if (branding.address) {
            doc.text(branding.address);
          }
          doc.fillColor('#000000');
        }

        if (branding.headerText) {
          doc.moveDown(0.5);
          doc.fontSize(10).text(branding.headerText);
        }

        doc.moveDown(1);
        doc.fontSize(14).fillColor('#000000').text('Charging receipt');
        doc.moveDown(0.75);
        doc.fontSize(10);

        const rows: [string, string][] = [
          ['Invoice', invoice.invoiceNumber],
          ['Status', invoice.status],
          ['Date', new Date(invoice.createdAt).toLocaleString()],
        ];
        if (branding.customerName) {
          rows.push(['Customer', branding.customerName]);
        }
        if (transaction.chargePointId) {
          rows.push(['Charge point', transaction.chargePointId]);
        }
        if (transaction.totalEnergyKwh != null) {
          rows.push(['Energy', `${Number(transaction.totalEnergyKwh).toFixed(3)} kWh`]);
        }
        if (invoice.subtotal != null) {
          rows.push(['Subtotal', `${currency} ${Number(invoice.subtotal).toFixed(2)}`]);
        }
        if (invoice.tax != null && Number(invoice.tax) > 0) {
          rows.push(['Tax', `${currency} ${Number(invoice.tax).toFixed(2)}`]);
        }
        rows.push(['Total', `${currency} ${Number(invoice.total ?? 0).toFixed(2)}`]);

        for (const [label, value] of rows) {
          doc.text(`${label}: ${value}`);
        }

        doc.moveDown(1);
        if (branding.footerText) {
          doc.fontSize(9).fillColor('#444444').text(branding.footerText);
        }
        if (branding.supportLine) {
          doc.text(branding.supportLine);
        }

        doc.end();
      } catch (err) {
        this.logger.error('PDF build failed', err);
        reject(err);
      }
    });
  }
}
