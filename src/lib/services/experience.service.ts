import { PrismaClient } from '@prisma/client';
import {
  Experience,
  CreateExperienceRequest,
  UpdateExperienceRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/about';

export class ExperienceService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 获取所有经验经历
   */
  async getAllExperiences(): Promise<Experience[]> {
    try {
      const experiences = await this.prisma.experience.findMany({
        orderBy: [
          {
            isCurrent: 'desc',
          },
          {
            startDate: 'desc',
          },
          {
            sortOrder: 'asc',
          },
        ],
      });
      return experiences;
    } catch (error) {
      console.error('Error getting experiences:', error);
      throw new Error('Failed to fetch experiences');
    }
  }

  /**
   * 根据类型获取经验经历
   */
  async getExperiencesByType(type: Experience['type']): Promise<Experience[]> {
    try {
      const experiences = await this.prisma.experience.findMany({
        where: { type },
        orderBy: [
          {
            isCurrent: 'desc',
          },
          {
            startDate: 'desc',
          },
          {
            sortOrder: 'asc',
          },
        ],
      });
      return experiences;
    } catch (error) {
      console.error(`Error getting experiences by type ${type}:`, error);
      return [];
    }
  }

  /**
   * 分页获取经验经历
   */
  async getExperiencesPaginated(
    page: number = 1,
    limit: number = 10,
    type?: Experience['type']
  ): Promise<PaginatedResponse<Experience>> {
    try {
      const skip = (page - 1) * limit;
      const where = type ? { type } : {};

      const [experiences, total] = await Promise.all([
        this.prisma.experience.findMany({
          where,
          orderBy: [
            {
              isCurrent: 'desc',
            },
            {
              startDate: 'desc',
            },
            {
              sortOrder: 'asc',
            },
          ],
          skip,
          take: limit,
        }),
        this.prisma.experience.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: experiences,
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
      console.error('Error getting experiences paginated:', error);
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
   * 根据ID获取经验经历
   */
  async getExperienceById(id: string): Promise<Experience | null> {
    try {
      const experience = await this.prisma.experience.findUnique({
        where: { id },
      });
      return experience;
    } catch (error) {
      console.error(`Error getting experience ${id}:`, error);
      return null;
    }
  }

  /**
   * 创建经验经历
   */
  async createExperience(data: CreateExperienceRequest): Promise<ApiResponse<Experience>> {
    try {
      // 获取下一个排序顺序
      const maxSortOrder = await this.prisma.experience.aggregate({
        where: { type: data.type },
        _max: { sortOrder: true },
      });

      const sortOrder = data.sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1;

      const experience = await this.prisma.experience.create({
        data: {
          ...data,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          sortOrder,
        },
      });

      return {
        success: true,
        data: experience,
        message: 'Experience created successfully',
      };
    } catch (error) {
      console.error('Error creating experience:', error);
      return {
        success: false,
        error: 'Failed to create experience',
      };
    }
  }

  /**
   * 更新经验经历
   */
  async updateExperience(
    id: string,
    data: UpdateExperienceRequest
  ): Promise<ApiResponse<Experience>> {
    try {
      const updateData: any = { ...data };

      // 处理日期字段
      if (data.startDate) {
        updateData.startDate = new Date(data.startDate);
      }

      if (data.endDate) {
        updateData.endDate = new Date(data.endDate);
      }

      const experience = await this.prisma.experience.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        data: experience,
        message: 'Experience updated successfully',
      };
    } catch (error) {
      console.error(`Error updating experience ${id}:`, error);
      return {
        success: false,
        error: 'Failed to update experience',
      };
    }
  }

  /**
   * 删除经验经历
   */
  async deleteExperience(id: string): Promise<ApiResponse> {
    try {
      await this.prisma.experience.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Experience deleted successfully',
      };
    } catch (error) {
      console.error(`Error deleting experience ${id}:`, error);
      return {
        success: false,
        error: 'Failed to delete experience',
      };
    }
  }

  /**
   * 重新排序经验经历
   */
  async reorderExperiences(orderedIds: string[]): Promise<ApiResponse<Experience[]>> {
    try {
      const updatePromises = orderedIds.map((id, index) =>
        this.prisma.experience.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      );

      const updatedExperiences = await Promise.all(updatePromises);

      return {
        success: true,
        data: updatedExperiences,
        message: 'Experiences reordered successfully',
      };
    } catch (error) {
      console.error('Error reordering experiences:', error);
      return {
        success: false,
        error: 'Failed to reorder experiences',
      };
    }
  }

  /**
   * 搜索经验经历
   */
  async searchExperiences(query: string): Promise<Experience[]> {
    try {
      const experiences = await this.prisma.experience.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              company: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              location: {
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
        orderBy: [
          {
            isCurrent: 'desc',
          },
          {
            startDate: 'desc',
          },
          {
            sortOrder: 'asc',
          },
        ],
      });

      return experiences;
    } catch (error) {
      console.error('Error searching experiences:', error);
      return [];
    }
  }

  /**
   * 获取当前工作经历
   */
  async getCurrentWorkExperiences(): Promise<Experience[]> {
    try {
      const experiences = await this.prisma.experience.findMany({
        where: {
          isCurrent: true,
          type: 'WORK',
        },
        orderBy: {
          startDate: 'desc',
        },
      });

      return experiences;
    } catch (error) {
      console.error('Error getting current work experiences:', error);
      return [];
    }
  }

  /**
   * 获取时间线格式的经验经历
   */
  async getTimelineExperiences(): Promise<any[]> {
    try {
      const experiences = await this.getAllExperiences();

      return experiences.map(exp => ({
        id: exp.id,
        date: exp.startDate.toISOString().split('T')[0],
        title: exp.title,
        description: exp.description,
        type: exp.type.toLowerCase(),
        company: exp.company,
        location: exp.location,
        isCurrent: exp.isCurrent,
        endDate: exp.endDate ? exp.endDate.toISOString().split('T')[0] : null,
      }));
    } catch (error) {
      console.error('Error getting timeline experiences:', error);
      return [];
    }
  }
}