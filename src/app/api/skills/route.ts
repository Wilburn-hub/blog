import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SkillService } from '@/lib/services/skill.service';
import { ApiResponse, CreateSkillRequest } from '@/types/about';

const prisma = new PrismaClient();
const skillService = new SkillService(prisma);

/**
 * GET /api/skills - 获取技能
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const paginate = searchParams.get('paginate') === 'true';
    const groups = searchParams.get('groups') === 'true';
    const categories = searchParams.get('categories') === 'true';
    const stats = searchParams.get('stats') === 'true';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // 根据ID获取单个技能
    if (id) {
      const skill = await skillService.getSkillById(id);
      if (skill) {
        return NextResponse.json({
          success: true,
          data: skill,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Skill not found',
          },
          { status: 404 }
        );
      }
    }

    // 根据分类获取技能
    if (category) {
      const skills = await skillService.getSkillsByCategory(category);
      return NextResponse.json({
        success: true,
        data: skills,
      });
    }

    // 获取技能分组
    if (groups) {
      const skillGroups = await skillService.getSkillGroups();
      return NextResponse.json({
        success: true,
        data: skillGroups,
      });
    }

    // 获取所有分类
    if (categories) {
      const skillCategories = await skillService.getSkillCategories();
      return NextResponse.json({
        success: true,
        data: skillCategories,
      });
    }

    // 获取统计信息
    if (stats) {
      const skillStats = await skillService.getSkillStats();
      return NextResponse.json({
        success: true,
        data: skillStats,
      });
    }

    // 搜索技能
    if (search) {
      const skills = await skillService.searchSkills(search);
      return NextResponse.json({
        success: true,
        data: skills,
      });
    }

    // 分页获取
    if (paginate) {
      const result = await skillService.getSkillsPaginated(
        page,
        limit,
        category || undefined,
        includeInactive
      );
      return NextResponse.json(result);
    }

    // 获取所有技能
    const skills = await skillService.getAllSkills();
    return NextResponse.json({
      success: true,
      data: skills,
    });
  } catch (error) {
    console.error('Error in GET /api/skills:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch skills',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/skills - 创建技能
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const { skills, ...singleSkill } = body;

    // 批量创建技能
    if (skills && Array.isArray(skills)) {
      const result = await skillService.createMultipleSkills(skills);
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 400 });
      }
    }

    // 创建单个技能
    const createData: CreateSkillRequest = singleSkill;
    const result = await skillService.createSkill(createData);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/skills:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create skill',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/skills - 更新技能
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const { reorder } = body;

    // 重新排序技能
    if (reorder && Array.isArray(reorder)) {
      const result = await skillService.reorderSkills(reorder);
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 400 });
      }
    }

    // 更新单个技能
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID is required for update',
        },
        { status: 400 }
      );
    }

    const result = await skillService.updateSkill(id, updateData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Error in PUT /api/skills:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update skill',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/skills - 删除技能
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const toggle = searchParams.get('toggle') === 'true';

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID parameter is required',
        },
        { status: 400 }
      );
    }

    // 切换激活状态
    if (toggle) {
      const result = await skillService.toggleSkillStatus(id);
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 404 });
      }
    }

    // 删除技能
    const result = await skillService.deleteSkill(id);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 404 });
    }
  } catch (error) {
    console.error('Error in DELETE /api/skills:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete skill',
      },
      { status: 500 }
    );
  }
}