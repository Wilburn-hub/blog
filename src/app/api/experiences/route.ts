import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ExperienceService } from '@/lib/services/experience.service';
import { ApiResponse, CreateExperienceRequest } from '@/types/about';

const prisma = new PrismaClient();
const experienceService = new ExperienceService(prisma);

/**
 * GET /api/experiences - 获取经验经历
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const paginate = searchParams.get('paginate') === 'true';
    const timeline = searchParams.get('timeline') === 'true';

    // 根据ID获取单个经验经历
    if (id) {
      const experience = await experienceService.getExperienceById(id);
      if (experience) {
        return NextResponse.json({
          success: true,
          data: experience,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Experience not found',
          },
          { status: 404 }
        );
      }
    }

    // 根据类型获取经验经历
    if (type) {
      const experiences = await experienceService.getExperiencesByType(
        type as any
      );
      return NextResponse.json({
        success: true,
        data: experiences,
      });
    }

    // 获取时间线格式
    if (timeline) {
      const experiences = await experienceService.getTimelineExperiences();
      return NextResponse.json({
        success: true,
        data: experiences,
      });
    }

    // 搜索经验经历
    if (search) {
      const experiences = await experienceService.searchExperiences(search);
      return NextResponse.json({
        success: true,
        data: experiences,
      });
    }

    // 分页获取
    if (paginate) {
      const result = await experienceService.getExperiencesPaginated(
        page,
        limit,
        type as any
      );
      return NextResponse.json(result);
    }

    // 获取所有经验经历
    const experiences = await experienceService.getAllExperiences();
    return NextResponse.json({
      success: true,
      data: experiences,
    });
  } catch (error) {
    console.error('Error in GET /api/experiences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch experiences',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/experiences - 创建经验经历
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const createData: CreateExperienceRequest = body;

    const result = await experienceService.createExperience(createData);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/experiences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create experience',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/experiences - 更新经验经历
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const { reorder } = body;

    // 重新排序经验经历
    if (reorder && Array.isArray(reorder)) {
      const result = await experienceService.reorderExperiences(reorder);
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 400 });
      }
    }

    // 更新单个经验经历
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID is required for update',
        },
        { status: 400 }
      );
    }

    const result = await experienceService.updateExperience(id, updateData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Error in PUT /api/experiences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update experience',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/experiences - 删除经验经历
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID parameter is required',
        },
        { status: 400 }
      );
    }

    const result = await experienceService.deleteExperience(id);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 404 });
    }
  } catch (error) {
    console.error('Error in DELETE /api/experiences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete experience',
      },
      { status: 500 }
    );
  }
}