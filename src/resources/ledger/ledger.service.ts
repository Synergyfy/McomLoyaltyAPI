import { Injectable } from '@nestjs/common';

interface LedgerEntry {
  plaqueId: string;
  price: number;
  sellerId: string;
  buyerId: string;
  timestamp: Date;
}

@Injectable()
export class LedgerService {
  private readonly entries: LedgerEntry[] = [];

  create(entry: {
    plaqueId: string;
    price: number;
    sellerId: string;
    buyerId: string;
  }) {
    const newEntry = { ...entry, timestamp: new Date() };
    this.entries.push(newEntry);
    console.log('Ledger entry created:', newEntry);
  }

  findAll(): LedgerEntry[] {
    return this.entries;
  }
}
