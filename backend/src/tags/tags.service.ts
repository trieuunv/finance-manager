import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const tags = await this.prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        createdAt: t.createdAt,
        usageCount: t._count.transactions,
      })),
    };
  }

  async findOne(userId: string, id: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('Thẻ nhãn (Tag) không tồn tại');
    }

    return {
      success: true,
      data: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        createdAt: tag.createdAt,
        usageCount: tag._count.transactions,
      },
    };
  }

  async create(userId: string, dto: CreateTagDto) {
    const tagName = dto.name.trim();

    const existing = await this.prisma.tag.findFirst({
      where: {
        userId,
        name: { equals: tagName, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new BadRequestException(`Nhãn "${tagName}" đã tồn tại`);
    }

    const tag = await this.prisma.tag.create({
      data: {
        userId,
        name: tagName,
        color: dto.color || '#2196F3',
      },
    });

    return {
      success: true,
      data: tag,
    };
  }

  async update(userId: string, id: string, dto: UpdateTagDto) {
    await this.findOne(userId, id);

    if (dto.name) {
      const tagName = dto.name.trim();
      const existing = await this.prisma.tag.findFirst({
        where: {
          userId,
          name: { equals: tagName, mode: 'insensitive' },
          NOT: { id },
        },
      });

      if (existing) {
        throw new BadRequestException(`Nhãn "${tagName}" đã tồn tại`);
      }
    }

    const updated = await this.prisma.tag.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        color: dto.color,
      },
    });

    return {
      success: true,
      data: updated,
    };
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.tag.delete({
      where: { id },
    });

    return { success: true, message: 'Đã xóa thẻ nhãn thành công' };
  }
}
