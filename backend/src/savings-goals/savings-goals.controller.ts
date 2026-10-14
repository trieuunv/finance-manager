import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';
import { DepositSavingsGoalDto } from './dto/deposit-savings-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('savings-goals')
@UseGuards(JwtAuthGuard)
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.savingsGoalsService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.savingsGoalsService.findOne(req.user.id, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateSavingsGoalDto) {
    return this.savingsGoalsService.create(req.user.id, dto);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateSavingsGoalDto) {
    return this.savingsGoalsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.savingsGoalsService.remove(req.user.id, id);
  }

  @Post(':id/deposit')
  async deposit(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: DepositSavingsGoalDto,
  ) {
    return this.savingsGoalsService.deposit(req.user.id, id, dto);
  }

  @Get(':id/contributions')
  async getContributions(@Request() req, @Param('id') id: string) {
    return this.savingsGoalsService.getContributions(req.user.id, id);
  }
}
