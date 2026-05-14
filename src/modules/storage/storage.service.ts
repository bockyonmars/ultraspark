import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';

export type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type StoredFile = {
  storageKey: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  absolutePath: string;
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly maxPdfBytes = 10 * 1024 * 1024;

  constructor(private readonly configService: ConfigService) {}

  async storeInvoicePdf(input: {
    invoiceId: string;
    invoiceNumber: string;
    file: UploadedFile;
  }): Promise<StoredFile> {
    this.assertPdf(input.file);

    const provider = this.configService.get<string>('app.storageProvider');
    if (provider && provider !== 'local') {
      throw new BadRequestException(
        `Storage provider ${provider} is not implemented in this deployment`,
      );
    }

    const now = new Date();
    const safeName = this.safeFileName(input.file.originalname);
    const storageKey = path.posix.join(
      'invoices',
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0'),
      input.invoiceId,
      `${Date.now()}-${safeName}`,
    );
    const root = this.getLocalRoot();
    const absolutePath = path.join(root, storageKey);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, input.file.buffer);

    this.logger.log(`Stored invoice PDF ${storageKey}`);

    return {
      storageKey,
      fileName: safeName,
      fileUrl: `/api/v1/admin/invoices/${input.invoiceId}/pdf`,
      fileSize: input.file.size,
      fileType: 'application/pdf',
      absolutePath,
    };
  }

  async readFile(storageKey: string) {
    const absolutePath = path.join(this.getLocalRoot(), storageKey);
    const file = await fs.readFile(absolutePath);
    const stat = await fs.stat(absolutePath);

    return {
      file,
      fileSize: stat.size,
      absolutePath,
    };
  }

  assertPdf(file?: UploadedFile | null) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfName = file.originalname.toLowerCase().endsWith('.pdf');

    if (!isPdfMime || !isPdfName) {
      throw new BadRequestException('Only PDF invoice files can be uploaded');
    }

    if (file.size <= 0) {
      throw new BadRequestException('Uploaded PDF is empty');
    }

    if (file.size > this.maxPdfBytes) {
      throw new BadRequestException('Invoice PDF must be 10MB or smaller');
    }
  }

  private getLocalRoot() {
    const configuredRoot = this.configService.get<string>('app.storageLocalRoot');

    if (configuredRoot) {
      return configuredRoot;
    }

    if (this.configService.get<string>('app.nodeEnv') === 'production') {
      throw new BadRequestException(
        'Invoice storage is not configured. Set STORAGE_LOCAL_ROOT to a persistent volume or configure a storage provider.',
      );
    }

    return path.join(process.cwd(), 'uploads');
  }

  private safeFileName(value: string) {
    const parsed = path.parse(value);
    const base = parsed.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    return `${base || 'invoice'}.pdf`;
  }
}
