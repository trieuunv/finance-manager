import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

const DEFAULT_CATEGORIES = [
  // EXPENSES
  {
    name: 'Ăn uống',
    icon: 'restaurant',
    color: '#EF4444',
    type: 'EXPENSE',
    subs: [
      { name: 'Ăn trưa', icon: 'lunch_dining', color: '#F87171' },
      { name: 'Cà phê & Bánh', icon: 'local_cafe', color: '#FCA5A5' },
      { name: 'Đi chợ & Siêu thị', icon: 'shopping_cart', color: '#FECACA' },
    ],
  },
  {
    name: 'Di chuyển',
    icon: 'directions_car',
    color: '#F59E0B',
    type: 'EXPENSE',
    subs: [
      { name: 'Xăng xe', icon: 'local_gas_station', color: '#FBBF24' },
      { name: 'Bảo dưỡng xe', icon: 'build', color: '#FDE047' },
      { name: 'Taxi / Grab', icon: 'local_taxi', color: '#FEF08A' },
    ],
  },
  {
    name: 'Hóa đơn & Tiện ích',
    icon: 'receipt_long',
    color: '#3B82F6',
    type: 'EXPENSE',
    subs: [
      { name: 'Tiền điện', icon: 'bolt', color: '#60A5FA' },
      { name: 'Tiền nước', icon: 'water_drop', color: '#93C5FD' },
      { name: 'Tiền Internet', icon: 'wifi', color: '#BFDBFE' },
    ],
  },
  {
    name: 'Mua sắm & Giải trí',
    icon: 'shopping_bag',
    color: '#EC4899',
    type: 'EXPENSE',
    subs: [
      { name: 'Quần áo', icon: 'checkroom', color: '#F472B6' },
      { name: 'Xem phim & Chơi game', icon: 'sports_esports', color: '#FBCFE8' },
    ],
  },
  {
    name: 'Sức khỏe & Y tế',
    icon: 'medical_services',
    color: '#10B981',
    type: 'EXPENSE',
    subs: [
      { name: 'Thuốc & Khám bệnh', icon: 'medication', color: '#34D399' },
    ],
  },
  // INCOMES
  {
    name: 'Lương',
    icon: 'payments',
    color: '#10B981',
    type: 'INCOME',
    subs: [],
  },
  {
    name: 'Thưởng & Phụ cấp',
    icon: 'card_giftcard',
    color: '#06B6D4',
    type: 'INCOME',
    subs: [],
  },
  {
    name: 'Đầu tư & Thu nhập khác',
    icon: 'trending_up',
    color: '#8B5CF6',
    type: 'INCOME',
    subs: [],
  },
];

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaultCategories(userId: string) {
    const existingCount = await this.prisma.category.count({
      where: { userId },
    });

    if (existingCount > 0) return;

    for (const cat of DEFAULT_CATEGORIES) {
      const parent = await this.prisma.category.create({
        data: {
          userId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type,
          isDefault: true,
        },
      });

      for (const sub of cat.subs) {
        await this.prisma.category.create({
          data: {
            userId,
            name: sub.name,
            icon: sub.icon,
            color: sub.color,
            type: cat.type,
            parentId: parent.id,
            isDefault: true,
          },
        });
      }
    }
  }

  async findAll(userId: string) {
    await this.seedDefaultCategories(userId);

    const categories = await this.prisma.category.findMany({
      where: { userId },
      include: {
        subCategories: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: categories,
    };
  }

  async create(userId: string, dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, userId },
      });
      if (!parent) {
        throw new NotFoundException('Danh mục cha không tồn tại');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        icon: dto.icon || 'category',
        color: dto.color || '#38BDF8',
        type: dto.type || 'EXPENSE',
        parentId: dto.parentId || null,
        isDefault: false,
      },
    });

    return { success: true, data: category };
  }

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
      include: { subCategories: true },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    if (category.subCategories.length > 0) {
      throw new BadRequestException('Không thể xóa danh mục cha khi vẫn còn danh mục con');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { success: true, message: 'Đã xóa danh mục thành công' };
  }
}
