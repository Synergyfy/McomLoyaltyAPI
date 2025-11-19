import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AssetService {
  constructor(private readonly configService: ConfigService) {}

  private get baseUrl(): string {
    return this.configService.get<string>('APP_URL', 'http://localhost:3000');
  }

  generateQrCodeUrl(plaqueId: string): string {
    return `${this.baseUrl}/assets/qr/${plaqueId}.png`;
  }

  generatePrintPdfUrl(plaqueId: string): string {
    return `${this.baseUrl}/assets/pdf/${plaqueId}.pdf`;
  }
}
