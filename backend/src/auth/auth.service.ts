import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        fullName: dto.fullName,
        baseCurrency: dto.baseCurrency || 'VND',
        wallets: {
          create: {
            name: 'Ví Tiền Mặt',
            type: 'CASH',
            balance: 0.0,
            currency: dto.baseCurrency || 'VND',
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        baseCurrency: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id, user.email);

    return {
      message: 'Đăng ký tài khoản thành công',
      user,
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const token = this.generateToken(user.id, user.email);

    const { password, ...userWithoutPassword } = user;

    return {
      message: 'Đăng nhập thành công',
      user: userWithoutPassword,
      accessToken: token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      // Để bảo mật, không tiết lộ email có tồn tại hay không
      return {
        message: 'Nếu email tồn tại trong hệ thống, mã xác nhận sẽ được gửi tới bạn.',
        resetToken: null,
      };
    }

    // Tạo mã token 6 chữ số làm Reset Code
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Hết hạn sau 15 phút

    // Lưu hoặc cập nhật token vào database
    await this.prisma.passwordReset.create({
      data: {
        email: user.email,
        token: resetToken,
        expiresAt,
      },
    });

    return {
      message: 'Mã xác thực khôi phục mật khẩu đã được khởi tạo.',
      resetToken, // Trả về token trực tiếp (Phục vụ việc test/sử dụng ở Client khi chưa tích hợp Mailer)
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        token: dto.token,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!resetRecord) {
      throw new BadRequestException('Mã khôi phục mật khẩu không hợp lệ');
    }

    if (new Date() > resetRecord.expiresAt) {
      throw new BadRequestException('Mã khôi phục mật khẩu đã hết hạn');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashedPassword },
    });

    // Xóa các reset token cũ của email này
    await this.prisma.passwordReset.deleteMany({
      where: { email: resetRecord.email },
    });

    return {
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.',
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        baseCurrency: true,
        createdAt: true,
        wallets: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin tài khoản');
    }

    return user;
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
    });
  }
}
