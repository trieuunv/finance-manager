import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';
import { DepositSavingsGoalDto } from './dto/deposit-savings-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('savings-goals')
@UseGuards(JwtAuthGuard)
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.savingsGoalsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.savingsGoalsService.findOne(userId, id);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateSavingsGoalDto) {
    return this.savingsGoalsService.create(userId, dto);
  }

  @Put(':id')
  async update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateSavingsGoalDto) {
    return this.savingsGoalsService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.savingsGoalsService.remove(userId, id);
  }

  @Post(':id/deposit')
  async deposit(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: DepositSavingsGoalDto,
  ) {
    return this.savingsGoalsService.deposit(userId, id, dto);
  }

  @Get(':id/contributions')
  async getContributions(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.savingsGoalsService.getContributions(userId, id);
  }
}
