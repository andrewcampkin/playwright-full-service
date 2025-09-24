import crypto from 'crypto';
import { DatabaseService } from './database.js';

// Encryption key for secrets (in production, this should be from environment variables)
const ENCRYPTION_KEY = process.env.SECRET_ENCRYPTION_KEY || 'your-32-character-secret-key-here!';
const ALGORITHM = 'aes-256-cbc';

class TestSuiteService {
  /**
   * Encrypt a secret value
   */
  static encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt a secret value
   */
  static decrypt(encryptedText) {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedData = textParts.join(':');
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Create a new test suite
   */
  static async createTestSuite({ userId, name, description, baseUrl, sitemap = null }) {
    try {
      const testSuite = await DatabaseService.prisma.testSuite.create({
        data: {
          userId,
          name,
          description,
          baseUrl,
          sitemap: sitemap ? JSON.stringify(sitemap) : null,
          status: 'draft'
        }
      });

      return testSuite;
    } catch (error) {
      console.error('Error creating test suite:', error);
      throw new Error('Failed to create test suite');
    }
  }

  /**
   * Get test suites for a user
   */
  static async getTestSuitesByUser(userId) {
    try {
      const testSuites = await DatabaseService.prisma.testSuite.findMany({
        where: {
          userId,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return testSuites.map(testSuite => ({
        ...testSuite,
        sitemap: testSuite.sitemap ? JSON.parse(testSuite.sitemap) : null
      }));
    } catch (error) {
      console.error('Error fetching test suites:', error);
      throw new Error('Failed to fetch test suites');
    }
  }

  /**
   * Get a specific test suite by ID
   */
  static async getTestSuiteById(testSuiteId) {
    try {
      const testSuite = await DatabaseService.prisma.testSuite.findUnique({
        where: {
          id: testSuiteId,
          isActive: true
        },
        include: {
          secrets: {
            where: {
              isActive: true
            }
          }
        }
      });

      if (!testSuite) {
        return null;
      }

      return {
        ...testSuite,
        sitemap: testSuite.sitemap ? JSON.parse(testSuite.sitemap) : null,
        secrets: testSuite.secrets.map(secret => ({
          ...secret,
          value: this.decrypt(secret.value) // Decrypt the secret value
        }))
      };
    } catch (error) {
      console.error('Error fetching test suite:', error);
      throw new Error('Failed to fetch test suite');
    }
  }

  /**
   * Update test suite with new sitemap data or other updates
   */
  static async updateTestSuite(testSuiteId, updates) {
    try {
      const updateData = {};
      
      if (updates.sitemap) {
        updateData.sitemap = JSON.stringify(updates.sitemap);
      }
      if (updates.status) {
        updateData.status = updates.status;
      }
      if (updates.name) {
        updateData.name = updates.name;
      }
      if (updates.description) {
        updateData.description = updates.description;
      }

      const testSuite = await DatabaseService.prisma.testSuite.update({
        where: { id: testSuiteId },
        data: updateData
      });

      return {
        ...testSuite,
        sitemap: testSuite.sitemap ? JSON.parse(testSuite.sitemap) : null
      };
    } catch (error) {
      console.error('Error updating test suite:', error);
      throw new Error('Failed to update test suite');
    }
  }

  /**
   * Add a secret to a test suite
   */
  static async addSecret(testSuiteId, { name, key, value, type = 'text', description }) {
    try {
      const encryptedValue = this.encrypt(value);
      
      const secret = await DatabaseService.prisma.secret.create({
        data: {
          testSuiteId,
          name,
          key,
          value: encryptedValue,
          type,
          description
        }
      });

      return {
        ...secret,
        value: value // Return the unencrypted value for the response
      };
    } catch (error) {
      console.error('Error adding secret:', error);
      throw new Error('Failed to add secret');
    }
  }

  /**
   * Get secrets for a test suite
   */
  static async getSecrets(testSuiteId) {
    try {
      const secrets = await DatabaseService.prisma.secret.findMany({
        where: {
          testSuiteId,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return secrets.map(secret => ({
        ...secret,
        value: this.decrypt(secret.value) // Decrypt the secret value
      }));
    } catch (error) {
      console.error('Error fetching secrets:', error);
      throw new Error('Failed to fetch secrets');
    }
  }

  /**
   * Update a secret
   */
  static async updateSecret(secretId, updates) {
    try {
      const updateData = {};
      
      if (updates.name) {
        updateData.name = updates.name;
      }
      if (updates.key) {
        updateData.key = updates.key;
      }
      if (updates.value) {
        updateData.value = this.encrypt(updates.value);
      }
      if (updates.type) {
        updateData.type = updates.type;
      }
      if (updates.description) {
        updateData.description = updates.description;
      }

      const secret = await DatabaseService.prisma.secret.update({
        where: { id: secretId },
        data: updateData
      });

      return {
        ...secret,
        value: updates.value || this.decrypt(secret.value)
      };
    } catch (error) {
      console.error('Error updating secret:', error);
      throw new Error('Failed to update secret');
    }
  }

  /**
   * Delete a secret
   */
  static async deleteSecret(secretId) {
    try {
      await DatabaseService.prisma.secret.update({
        where: { id: secretId },
        data: { isActive: false }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting secret:', error);
      throw new Error('Failed to delete secret');
    }
  }

  /**
   * Delete a test suite
   */
  static async deleteTestSuite(testSuiteId) {
    try {
      // First, deactivate all secrets
      await DatabaseService.prisma.secret.updateMany({
        where: { testSuiteId },
        data: { isActive: false }
      });

      // Then deactivate the test suite
      await DatabaseService.prisma.testSuite.update({
        where: { id: testSuiteId },
        data: { isActive: false }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting test suite:', error);
      throw new Error('Failed to delete test suite');
    }
  }
}

export { TestSuiteService };
