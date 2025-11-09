import { PrismaClient } from '@prisma/client';
import {
  Skill,
  CreateSkillRequest,
  UpdateSkillRequest,
  ApiResponse,
  PaginatedResponse,
  SkillGroup,
  SKILL_CATEGORIES,
} from '@/types/about';

export class SkillService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 获取所有技能
   */
  async getAllSkills(): Promise<Skill[]> {
    try {
      const skills = await this.prisma.skill.findMany({
        where: {
          isActive: true,
        },
        orderBy: [
          {
            category: 'asc',
          },
          {
            sortOrder: 'asc',
          },
          {
            name: 'asc',
          },
        ],
      });
      return skills;
    } catch (error) {
      console.error('Error getting skills:', error);
      throw new Error('Failed to fetch skills');
    }
  }

  /**
   * 根据分类获取技能
   */
  async getSkillsByCategory(category: string): Promise<Skill[]> {
    try {
      const skills = await this.prisma.skill.findMany({
        where: {
          category,
          isActive: true,
        },
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            level: 'desc',
          },
          {
            name: 'asc',
          },
        ],
      });
      return skills;
    } catch (error) {
      console.error(`Error getting skills by category ${category}:`, error);
      return [];
    }
  }

  /**
   * 获取技能分组
   */
  async getSkillGroups(): Promise<SkillGroup[]> {
    try {
      const skills = await this.getAllSkills();
      const groupedSkills: Record<string, Skill[]> = {};

      // 按分类分组
      skills.forEach(skill => {
        const category = skill.category || 'other';
        if (!groupedSkills[category]) {
          groupedSkills[category] = [];
        }
        groupedSkills[category].push(skill);
      });

      // 转换为 SkillGroup 数组
      const skillGroups: SkillGroup[] = Object.entries(groupedSkills).map(
        ([category, skills]) => ({
          category,
          skills,
        })
      );

      // 按分类名称排序
      skillGroups.sort((a, b) => {
        const aLabel = SKILL_CATEGORIES[a.category as keyof typeof SKILL_CATEGORIES] || a.category;
        const bLabel = SKILL_CATEGORIES[b.category as keyof typeof SKILL_CATEGORIES] || b.category;
        return aLabel.localeCompare(bLabel);
      });

      return skillGroups;
    } catch (error) {
      console.error('Error getting skill groups:', error);
      return [];
    }
  }

  /**
   * 分页获取技能
   */
  async getSkillsPaginated(
    page: number = 1,
    limit: number = 10,
    category?: string,
    includeInactive: boolean = false
  ): Promise<PaginatedResponse<Skill>> {
    try {
      const skip = (page - 1) * limit;
      const where: any = includeInactive ? {} : { isActive: true };

      if (category) {
        where.category = category;
      }

      const [skills, total] = await Promise.all([
        this.prisma.skill.findMany({
          where,
          orderBy: [
            {
              category: 'asc',
            },
            {
              sortOrder: 'asc',
            },
            {
              name: 'asc',
            },
          ],
          skip,
          take: limit,
        }),
        this.prisma.skill.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: skills,
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
      console.error('Error getting skills paginated:', error);
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
   * 根据ID获取技能
   */
  async getSkillById(id: string): Promise<Skill | null> {
    try {
      const skill = await this.prisma.skill.findUnique({
        where: { id },
      });
      return skill;
    } catch (error) {
      console.error(`Error getting skill ${id}:`, error);
      return null;
    }
  }

  /**
   * 根据名称获取技能
   */
  async getSkillByName(name: string): Promise<Skill | null> {
    try {
      const skill = await this.prisma.skill.findUnique({
        where: { name },
      });
      return skill;
    } catch (error) {
      console.error(`Error getting skill by name ${name}:`, error);
      return null;
    }
  }

  /**
   * 创建技能
   */
  async createSkill(data: CreateSkillRequest): Promise<ApiResponse<Skill>> {
    try {
      // 检查技能是否已存在
      const existingSkill = await this.prisma.skill.findUnique({
        where: { name: data.name },
      });

      if (existingSkill) {
        return {
          success: false,
          error: `Skill "${data.name}" already exists`,
        };
      }

      // 获取下一个排序顺序
      const maxSortOrder = await this.prisma.skill.aggregate({
        where: {
          category: data.category || 'other',
          isActive: true
        },
        _max: { sortOrder: true },
      });

      const sortOrder = data.sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1;

      const skill = await this.prisma.skill.create({
        data: {
          ...data,
          sortOrder,
        },
      });

      return {
        success: true,
        data: skill,
        message: 'Skill created successfully',
      };
    } catch (error) {
      console.error('Error creating skill:', error);
      return {
        success: false,
        error: 'Failed to create skill',
      };
    }
  }

  /**
   * 更新技能
   */
  async updateSkill(
    id: string,
    data: UpdateSkillRequest
  ): Promise<ApiResponse<Skill>> {
    try {
      // 如果更改名称，检查新名称是否已存在
      if (data.name) {
        const existingSkill = await this.prisma.skill.findFirst({
          where: {
            name: data.name,
            id: { not: id },
          },
        });

        if (existingSkill) {
          return {
            success: false,
            error: `Skill "${data.name}" already exists`,
          };
        }
      }

      const skill = await this.prisma.skill.update({
        where: { id },
        data,
      });

      return {
        success: true,
        data: skill,
        message: 'Skill updated successfully',
      };
    } catch (error) {
      console.error(`Error updating skill ${id}:`, error);
      return {
        success: false,
        error: 'Failed to update skill',
      };
    }
  }

  /**
   * 删除技能
   */
  async deleteSkill(id: string): Promise<ApiResponse> {
    try {
      await this.prisma.skill.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Skill deleted successfully',
      };
    } catch (error) {
      console.error(`Error deleting skill ${id}:`, error);
      return {
        success: false,
        error: 'Failed to delete skill',
      };
    }
  }

  /**
   * 切换技能激活状态
   */
  async toggleSkillStatus(id: string): Promise<ApiResponse<Skill>> {
    try {
      const skill = await this.prisma.skill.findUnique({
        where: { id },
      });

      if (!skill) {
        return {
          success: false,
          error: 'Skill not found',
        };
      }

      const updatedSkill = await this.prisma.skill.update({
        where: { id },
        data: {
          isActive: !skill.isActive,
        },
      });

      return {
        success: true,
        data: updatedSkill,
        message: `Skill ${updatedSkill.isActive ? 'activated' : 'deactivated'} successfully`,
      };
    } catch (error) {
      console.error(`Error toggling skill status ${id}:`, error);
      return {
        success: false,
        error: 'Failed to toggle skill status',
      };
    }
  }

  /**
   * 重新排序技能
   */
  async reorderSkills(orderedIds: string[]): Promise<ApiResponse<Skill[]>> {
    try {
      const updatePromises = orderedIds.map((id, index) =>
        this.prisma.skill.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      );

      const updatedSkills = await Promise.all(updatePromises);

      return {
        success: true,
        data: updatedSkills,
        message: 'Skills reordered successfully',
      };
    } catch (error) {
      console.error('Error reordering skills:', error);
      return {
        success: false,
        error: 'Failed to reorder skills',
      };
    }
  }

  /**
   * 批量创建技能
   */
  async createMultipleSkills(
    skills: CreateSkillRequest[]
  ): Promise<ApiResponse<Skill[]>> {
    try {
      // 检查名称重复
      const names = skills.map(skill => skill.name);
      const existingSkills = await this.prisma.skill.findMany({
        where: {
          name: {
            in: names,
          },
        },
      });

      if (existingSkills.length > 0) {
        const existingNames = existingSkills.map(skill => skill.name);
        return {
          success: false,
          error: `Skills already exist: ${existingNames.join(', ')}`,
        };
      }

      // 添加排序顺序
      const skillsWithOrder = skills.map((skill, index) => ({
        ...skill,
        sortOrder: skill.sortOrder ?? index + 1,
      }));

      const createdSkills = await this.prisma.skill.createMany({
        data: skillsWithOrder,
      });

      return {
        success: true,
        data: createdSkills as any, // Prisma createMany doesn't return the created objects
        message: `${skills.length} skills created successfully`,
      };
    } catch (error) {
      console.error('Error creating multiple skills:', error);
      return {
        success: false,
        error: 'Failed to create multiple skills',
      };
    }
  }

  /**
   * 获取所有技能分类
   */
  async getSkillCategories(): Promise<string[]> {
    try {
      const categories = await this.prisma.skill.findMany({
        where: {
          isActive: true,
        },
        select: {
          category: true,
        },
        distinct: ['category'],
      });

      return categories
        .map(c => c.category || 'other')
        .filter((category, index, arr) => arr.indexOf(category) === index)
        .sort();
    } catch (error) {
      console.error('Error getting skill categories:', error);
      return [];
    }
  }

  /**
   * 搜索技能
   */
  async searchSkills(query: string): Promise<Skill[]> {
    try {
      const skills = await this.prisma.skill.findMany({
        where: {
          isActive: true,
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              category: {
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
            category: 'asc',
          },
          {
            sortOrder: 'asc',
          },
          {
            name: 'asc',
          },
        ],
      });

      return skills;
    } catch (error) {
      console.error('Error searching skills:', error);
      return [];
    }
  }

  /**
   * 获取技能统计信息
   */
  async getSkillStats(): Promise<{
    totalSkills: number;
    activeSkills: number;
    categoriesCount: number;
    averageLevel: number;
  }> {
    try {
      const [totalSkills, activeSkills, categoriesResult, averageLevelResult] = await Promise.all([
        this.prisma.skill.count(),
        this.prisma.skill.count({ where: { isActive: true } }),
        this.prisma.skill.groupBy({
          by: ['category'],
          where: { isActive: true },
        }),
        this.prisma.skill.aggregate({
          where: { isActive: true },
          _avg: { level: true },
        }),
      ]);

      return {
        totalSkills,
        activeSkills,
        categoriesCount: categoriesResult.length,
        averageLevel: averageLevelResult._avg.level || 0,
      };
    } catch (error) {
      console.error('Error getting skill stats:', error);
      return {
        totalSkills: 0,
        activeSkills: 0,
        categoriesCount: 0,
        averageLevel: 0,
      };
    }
  }
}