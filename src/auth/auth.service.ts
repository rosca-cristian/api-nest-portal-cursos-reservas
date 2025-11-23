import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { mapRoleToApiFormat, mapApiFormatToRole } from '../common/utils/role-mapper';
import { Role } from '@prisma/client';

// Story 1.3: Extended user type with reservation fields
interface UserWithReservationFields {
  id: string;
  email: string;
  name: string;
  role: Role;
  major?: string | null;
  department?: string | null;
  photoUrl?: string | null;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    // Story 1.3: Convert API role format to database enum
    const roleEnum = mapApiFormatToRole(dto.role);

    const user = await this.usersService.create({
      ...dto,
      role: roleEnum as any, // Pass enum to Prisma
    });

    // Return user with API-formatted role
    return {
      ...user,
      role: mapRoleToApiFormat(user.role),
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  login(user: UserWithReservationFields) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role, // Store DB enum in JWT
    };

    // Story 1.3: Return API format with new reservation fields
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: mapRoleToApiFormat(user.role), // Convert to API format
        major: user.major,
        department: user.department,
        photoUrl: user.photoUrl,
        createdAt: user.createdAt,
      },
    };
  }
}
