import { PrismaClient } from '@prisma/client';
import { Setting, SETTING_KEYS } from '@/types/about';

export class SettingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 获取单个设置
   */
  async getSetting(key: string): Promise<Setting | null> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key },
      });
      return setting;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }

  /**
   * 获取多个设置
   */
  async getSettings(keys: string[]): Promise<Record<string, string>> {
    try {
      const settings = await this.prisma.setting.findMany({
        where: {
          key: {
            in: keys,
          },
        },
      });

      const result: Record<string, string> = {};
      settings.forEach(setting => {
        result[setting.key] = setting.value;
      });

      return result;
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  }

  /**
   * 获取所有设置
   */
  async getAllSettings(): Promise<Setting[]> {
    try {
      const settings = await this.prisma.setting.findMany({
        orderBy: {
          key: 'asc',
        },
      });
      return settings;
    } catch (error) {
      console.error('Error getting all settings:', error);
      throw new Error('Failed to fetch settings');
    }
  }

  /**
   * 创建或更新设置
   */
  async upsertSetting(
    key: string,
    value: string,
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' = 'STRING'
  ): Promise<Setting> {
    try {
      const setting = await this.prisma.setting.upsert({
        where: { key },
        update: {
          value,
          type,
        },
        create: {
          key,
          value,
          type,
        },
      });
      return setting;
    } catch (error) {
      console.error(`Error upserting setting ${key}:`, error);
      throw new Error(`Failed to upsert setting: ${key}`);
    }
  }

  /**
   * 批量创建或更新设置
   */
  async upsertMultipleSettings(
    settings: Array<{
      key: string;
      value: string;
      type?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    }>
  ): Promise<Setting[]> {
    try {
      const results = await Promise.all(
        settings.map(({ key, value, type = 'STRING' }) =>
          this.upsertSetting(key, value, type)
        )
      );
      return results;
    } catch (error) {
      console.error('Error upserting multiple settings:', error);
      throw new Error('Failed to upsert multiple settings');
    }
  }

  /**
   * 删除设置
   */
  async deleteSetting(key: string): Promise<boolean> {
    try {
      await this.prisma.setting.delete({
        where: { key },
      });
      return true;
    } catch (error) {
      console.error(`Error deleting setting ${key}:`, error);
      return false;
    }
  }

  /**
   * 检查设置是否存在
   */
  async settingExists(key: string): Promise<boolean> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key },
        select: { id: true },
      });
      return !!setting;
    } catch (error) {
      console.error(`Error checking setting existence ${key}:`, error);
      return false;
    }
  }

  /**
   * 获取个人基本信息
   */
  async getPersonalInfo() {
    const keys = [
      SETTING_KEYS.SITE_AUTHOR,
      SETTING_KEYS.PERSONAL_BIO,
      SETTING_KEYS.PERSONAL_AVATAR,
      SETTING_KEYS.PERSONAL_LOCATION,
      SETTING_KEYS.PERSONAL_WEBSITE,
      SETTING_KEYS.SITE_EMAIL,
      SETTING_KEYS.PERSONAL_PHONE,
      SETTING_KEYS.PERSONAL_RESUME,
      SETTING_KEYS.PERSONAL_TAGLINE,
    ];

    const settings = await this.getSettings(keys);

    return {
      name: settings[SETTING_KEYS.SITE_AUTHOR] || '',
      bio: settings[SETTING_KEYS.PERSONAL_BIO] || '',
      avatar: settings[SETTING_KEYS.PERSONAL_AVATAR] || '',
      location: settings[SETTING_KEYS.PERSONAL_LOCATION] || '',
      website: settings[SETTING_KEYS.PERSONAL_WEBSITE] || '',
      email: settings[SETTING_KEYS.SITE_EMAIL] || '',
      phone: settings[SETTING_KEYS.PERSONAL_PHONE] || '',
      resume: settings[SETTING_KEYS.PERSONAL_RESUME] || '',
      tagline: settings[SETTING_KEYS.PERSONAL_TAGLINE] || '',
    };
  }

  /**
   * 更新个人基本信息
   */
  async updatePersonalInfo(personalInfo: {
    name?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
    email?: string;
    phone?: string;
    resume?: string;
    tagline?: string;
  }) {
    const updates: Array<{
      key: string;
      value: string;
      type?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    }> = [];

    if (personalInfo.name !== undefined) {
      updates.push({
        key: SETTING_KEYS.SITE_AUTHOR,
        value: personalInfo.name,
      });
    }

    if (personalInfo.bio !== undefined) {
      updates.push({
        key: SETTING_KEYS.PERSONAL_BIO,
        value: personalInfo.bio,
      });
    }

    if (personalInfo.avatar !== undefined) {
      updates.push({
        key: SETTING_KEYS.PERSONAL_AVATAR,
        value: personalInfo.avatar,
      });
    }

    if (personalInfo.location !== undefined) {
      updates.push({
        key: SETTING_KEYS.PERSONAL_LOCATION,
        value: personalInfo.location,
      });
    }

    if (personalInfo.website !== undefined) {
      updates.push({
        key: SETTING_KEYS.PERSONAL_WEBSITE,
        value: personalInfo.website,
      });
    }

    if (personalInfo.email !== undefined) {
      updates.push({
        key: SETTING_KEYS.SITE_EMAIL,
        value: personalInfo.email,
      });
    }

    if (personalInfo.phone !== undefined) {
      updates.push({
        key: SETTING_KEYS.PERSONAL_PHONE,
        value: personalInfo.phone,
      });
    }

    if (personalInfo.resume !== undefined) {
      updates.push({
        key: SETTING_KEYS.PERSONAL_RESUME,
        value: personalInfo.resume,
      });
    }

    if (personalInfo.tagline !== undefined) {
      updates.push({
        key: SETTING_KEYS.PERSONAL_TAGLINE,
        value: personalInfo.tagline,
      });
    }

    return await this.upsertMultipleSettings(updates);
  }

  /**
   * 获取网站基本信息
   */
  async getSiteInfo() {
    const keys = [
      SETTING_KEYS.SITE_NAME,
      SETTING_KEYS.SITE_DESCRIPTION,
      SETTING_KEYS.SITE_AUTHOR,
      SETTING_KEYS.SITE_EMAIL,
      SETTING_KEYS.GOOGLE_ANALYTICS_ID,
      SETTING_KEYS.THEME_PRIMARY_COLOR,
      SETTING_KEYS.THEME_SECONDARY_COLOR,
    ];

    const settings = await this.getSettings(keys);

    return {
      siteName: settings[SETTING_KEYS.SITE_NAME] || 'Personal Blog',
      siteDescription: settings[SETTING_KEYS.SITE_DESCRIPTION] || '',
      siteAuthor: settings[SETTING_KEYS.SITE_AUTHOR] || '',
      siteEmail: settings[SETTING_KEYS.SITE_EMAIL] || '',
      googleAnalyticsId: settings[SETTING_KEYS.GOOGLE_ANALYTICS_ID] || '',
      themePrimaryColor: settings[SETTING_KEYS.THEME_PRIMARY_COLOR] || '#3b82f6',
      themeSecondaryColor: settings[SETTING_KEYS.THEME_SECONDARY_COLOR] || '#6366f1',
    };
  }

  /**
   * 初始化默认设置
   */
  async initializeDefaultSettings() {
    const defaultSettings = [
      {
        key: SETTING_KEYS.SITE_NAME,
        value: 'Personal Blog',
        type: 'STRING' as const,
      },
      {
        key: SETTING_KEYS.SITE_DESCRIPTION,
        value: 'A personal blog about technology and life',
        type: 'STRING' as const,
      },
      {
        key: SETTING_KEYS.SITE_AUTHOR,
        value: 'Blog Author',
        type: 'STRING' as const,
      },
      {
        key: SETTING_KEYS.THEME_PRIMARY_COLOR,
        value: '#3b82f6',
        type: 'STRING' as const,
      },
      {
        key: SETTING_KEYS.THEME_SECONDARY_COLOR,
        value: '#6366f1',
        type: 'STRING' as const,
      },
    ];

    return await this.upsertMultipleSettings(defaultSettings);
  }
}