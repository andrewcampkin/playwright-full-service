import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService } from './database.js';

export class AuthService {
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async register(userData) {
    const { email, password, name } = userData;

    // Check if user already exists
    const existingUser = await DatabaseService.findUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await DatabaseService.createUser({
      email,
      name,
      passwordHash,
      provider: 'local',
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async login(email, password) {
    // Find user
    const user = await DatabaseService.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    if (!user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = await this.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async authenticateToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({ 
          success: false,
          error: 'Access token required' 
        });
      }

      const decoded = this.verifyToken(token);
      const user = await DatabaseService.findUserById(decoded.id);

      if (!user || !user.isActive) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid or expired token' 
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token' 
      });
    }
  }

  static async getCurrentUser(req) {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return req.user;
  }
}
