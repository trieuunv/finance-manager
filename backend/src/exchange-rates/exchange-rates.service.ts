import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertExchangeRateDto } from './dto/upsert-exchange-rate.dto';

export interface RateLookup {
  /** Latest rate for each "from->to" pair on or before the requested date. */
  find(from: string, to: string): number | null;
}

/** Pure conversion: direct rate, then inverse rate. Returns null when unknown. */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: RateLookup,
): number | null {
  if (from === to) return amount;
  const direct = rates.find(from, to);
  if (direct) return amount * direct;
  const inverse = rates.find(to, from);
  if (inverse) return amount / inverse;
  return null;
}

const toDay = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

@Injectable()
export class ExchangeRatesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: UpsertExchangeRateDto) {
    const fromCurrency = dto.fromCurrency.toUpperCase();
    const toCurrency = (dto.toCurrency || 'VND').toUpperCase();
    if (fromCurrency === toCurrency) {
      throw new BadRequestException('Hai loại tiền tệ phải khác nhau');
    }
    const effectiveDate = toDay(dto.effectiveDate ? new Date(dto.effectiveDate) : new Date());

    const row = await this.prisma.exchangeRate.upsert({
      where: {
        fromCurrency_toCurrency_effectiveDate: { fromCurrency, toCurrency, effectiveDate },
      },
      create: { fromCurrency, toCurrency, rate: dto.rate, effectiveDate },
      update: { rate: dto.rate },
    });

    return { success: true, data: { ...row, rate: Number(row.rate) } };
  }

  async list(from?: string, to?: string) {
    const rows = await this.prisma.exchangeRate.findMany({
      where: {
        fromCurrency: from?.toUpperCase(),
        toCurrency: to?.toUpperCase(),
      },
      orderBy: { effectiveDate: 'desc' },
      take: 200,
    });
    return { success: true, data: rows.map((r) => ({ ...r, rate: Number(r.rate) })) };
  }

  /** Loads latest rates (on or before `date`) for the given currencies into a lookup. */
  async loadLookup(currencies: string[], date: Date = new Date()): Promise<RateLookup> {
    const list = [...new Set(currencies.map((c) => c.toUpperCase()))];
    const rows = list.length
      ? await this.prisma.exchangeRate.findMany({
          where: {
            effectiveDate: { lte: date },
            OR: [{ fromCurrency: { in: list } }, { toCurrency: { in: list } }],
          },
          orderBy: { effectiveDate: 'desc' },
        })
      : [];

    const map = new Map<string, number>();
    for (const r of rows) {
      const key = `${r.fromCurrency}->${r.toCurrency}`;
      if (!map.has(key)) map.set(key, Number(r.rate)); // rows are newest-first
    }
    return { find: (f, t) => map.get(`${f.toUpperCase()}->${t.toUpperCase()}`) ?? null };
  }

  async convert(amount: number, from: string, to: string, date?: Date) {
    const lookup = await this.loadLookup([from, to], date);
    return convertAmount(amount, from.toUpperCase(), to.toUpperCase(), lookup);
  }
}
