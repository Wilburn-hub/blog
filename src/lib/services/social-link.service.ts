import { PrismaClient } from '@prisma/client';
import {
  SocialLink,
  CreateSocialLinkRequest,
  UpdateSocialLinkRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/about';

export class SocialLinkService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 获取所有社交链接
   */
  async getAllSocialLinks(): Promise<SocialLink[]> {
    try {
      const links = await this.prisma.socialLink.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });
      return links;
    } catch (error) {
      console.error('Error getting social links:', error);
      throw new Error('Failed to fetch social links');
    }
  }

  /**
   * 分页获取社交链接（包括非激活的）
   */
  async getSocialLinksPaginated(
    page: number = 1,
    limit: number = 10,
    includeInactive: boolean = false
  ): Promise<PaginatedResponse<SocialLink>> {
    try {
      const skip = (page - 1) * limit;
      const where = includeInactive ? {} : { isActive: true };

      const [links, total] = await Promise.all([
        this.prisma.socialLink.findMany({
          where,
          orderBy: {
            sortOrder: 'asc',
          },
          skip,
          take: limit,
        }),
        this.prisma.socialLink.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: links,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error getting social links paginated:', error);
      return {
        success: false,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }

  /**
   * 根据ID获取社交链接
   */
  async getSocialLinkById(id: string): Promise<SocialLink | null> {
    try {
      const link = await this.prisma.socialLink.findUnique({
        where: { id },
      });
      return link;
    } catch (error) {
      console.error(`Error getting social link ${id}:`, error);
      return null;
    }
  }

  /**
   * 根据平台获取社交链接
   */
  async getSocialLinkByPlatform(platform: string): Promise<SocialLink | null> {
    try {
      const link = await this.prisma.socialLink.findFirst({
        where: {
          platform,
          isActive: true
        },
      });
      return link;
    } catch (error) {
      console.error(`Error getting social link by platform ${platform}:`, error);
      return null;
    }
  }

  /**
   * 创建社交链接
   */
  async createSocialLink(data: CreateSocialLinkRequest): Promise<ApiResponse<SocialLink>> {
    try {
      // 检查平台是否已存在
      const existingLink = await this.prisma.socialLink.findFirst({
        where: { platform },
      });

      if (existingLink) {
        return {
          success: false,
          error: `Platform "${platform}" already exists`,
        };
      }

      // 获取下一个排序顺序
      const maxSortOrder = await this.prisma.socialLink.aggregate({
        where: { isActive: true },
        _max: { sortOrder: true },
      });

      const sortOrder = data.sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1;

      const link = await this.prisma.socialLink.create({
        data: {
          ...data,
          sortOrder,
        },
      });

      return {
        success: true,
        data: link,
        message: 'Social link created successfully',
      };
    } catch (error) {
      console.error('Error creating social link:', error);
      return {
        success: false,
        error: 'Failed to create social link',
      };
    }
  }

  /**
   * 更新社交链接
   */
  async updateSocialLink(
    id: string,
    data: UpdateSocialLinkRequest
  ): Promise<ApiResponse<SocialLink>> {
    try {
      // 如果更改平台，检查新平台是否已存在
      if (data.platform) {
        const existingLink = await this.prisma.socialLink.findFirst({
          where: {
            platform: data.platform,
            id: { not: id },
          },
        });

        if (existingLink) {
          return {
            success: false,
            error: `Platform "${data.platform}" already exists`,
          };
        }
      }

      const link = await this.prisma.socialLink.update({
        where: { id },
        data,
      });

      return {
        success: true,
        data: link,
        message: 'Social link updated successfully',
      };
    } catch (error) {
      console.error(`Error updating social link ${id}:`, error);
      return {
        success: false,
        error: 'Failed to update social link',
      };
    }
  }

  /**
   * 删除社交链接
   */
  async deleteSocialLink(id: string): Promise<ApiResponse> {
    try {
      await this.prisma.socialLink.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Social link deleted successfully',
      };
    } catch (error) {
      console.error(`Error deleting social link ${id}:`, error);
      return {
        success: false,
        error: 'Failed to delete social link',
      };
    }
  }

  /**
   * 切换社交链接激活状态
   */
  async toggleSocialLinkStatus(id: string): Promise<ApiResponse<SocialLink>> {
    try {
      const link = await this.prisma.socialLink.findUnique({
        where: { id },
      });

      if (!link) {
        return {
          success: false,
          error: 'Social link not found',
        };
      }

      const updatedLink = await this.prisma.socialLink.update({
        where: { id },
        data: {
          isActive: !link.isActive,
        },
      });

      return {
        success: true,
        data: updatedLink,
        message: `Social link ${updatedLink.isActive ? 'activated' : 'deactivated'} successfully`,
      };
    } catch (error) {
      console.error(`Error toggling social link status ${id}:`, error);
      return {
        success: false,
        error: 'Failed to toggle social link status',
      };
    }
  }

  /**
   * 重新排序社交链接
   */
  async reorderSocialLinks(orderedIds: string[]): Promise<ApiResponse<SocialLink[]>> {
    try {
      const updatePromises = orderedIds.map((id, index) =>
        this.prisma.socialLink.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      );

      const updatedLinks = await Promise.all(updatePromises);

      return {
        success: true,
        data: updatedLinks,
        message: 'Social links reordered successfully',
      };
    } catch (error) {
      console.error('Error reordering social links:', error);
      return {
        success: false,
        error: 'Failed to reorder social links',
      };
    }
  }

  /**
   * 批量创建社交链接
   */
  async createMultipleSocialLinks(
    links: CreateSocialLinkRequest[]
  ): Promise<ApiResponse<SocialLink[]>> {
    try {
      // 检查平台重复
      const platforms = links.map(link => link.platform);
      const existingLinks = await this.prisma.socialLink.findMany({
        where: {
          platform: {
            in: platforms,
          },
        },
      });

      if (existingLinks.length > 0) {
        const existingPlatforms = existingLinks.map(link => link.platform);
        return {
          success: false,
          error: `Platforms already exist: ${existingPlatforms.join(', ')}`,
        };
      }

      // 添加排序顺序
      const maxSortOrder = await this.prisma.socialLink.aggregate({
        where: { isActive: true },
        _max: { sortOrder: true },
      });

      const linksWithOrder = links.map((link, index) => ({
        ...link,
        sortOrder: (link.sortOrder ?? 0) || ((maxSortOrder._max.sortOrder ?? 0) + index + 1),
      }));

      const createdLinks = await this.prisma.socialLink.createMany({
        data: linksWithOrder,
      });

      return {
        success: true,
        data: createdLinks as any, // Prisma createMany doesn't return the created objects
        message: `${links.length} social links created successfully`,
      };
    } catch (error) {
      console.error('Error creating multiple social links:', error);
      return {
        success: false,
        error: 'Failed to create multiple social links',
      };
    }
  }

  /**
   * 获取活跃的社交链接数量
   */
  async getActiveSocialLinksCount(): Promise<number> {
    try {
      const count = await this.prisma.socialLink.count({
        where: { isActive: true },
      });
      return count;
    } catch (error) {
      console.error('Error getting active social links count:', error);
      return 0;
    }
  }

  /**
   * 搜索社交链接
   */
  async searchSocialLinks(query: string): Promise<SocialLink[]> {
    try {
      const links = await this.prisma.socialLink.findMany({
        where: {
          isActive: true,
          OR: [
            {
              platform: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });

      return links;
    } catch (error) {
      console.error('Error searching social links:', error);
      return [];
    }
  }
}