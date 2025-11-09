import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SocialLinkService } from '@/lib/services/social-link.service';
import { ApiResponse, CreateSocialLinkRequest } from '@/types/about';

const prisma = new PrismaClient();
const socialLinkService = new SocialLinkService(prisma);

/**
 * GET /api/social - 获取社交链接
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const platform = searchParams.get('platform');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const paginate = searchParams.get('paginate') === 'true';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // 根据ID获取单个社交链接
    if (id) {
      const socialLink = await socialLinkService.getSocialLinkById(id);
      if (socialLink) {
        return NextResponse.json({
          success: true,
          data: socialLink,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Social link not found',
          },
          { status: 404 }
        );
      }
    }

    // 根据平台获取社交链接
    if (platform) {
      const socialLink = await socialLinkService.getSocialLinkByPlatform(platform);
      if (socialLink) {
        return NextResponse.json({
          success: true,
          data: socialLink,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Social link not found for this platform',
          },
          { status: 404 }
        );
      }
    }

    // 搜索社交链接
    if (search) {
      const socialLinks = await socialLinkService.searchSocialLinks(search);
      return NextResponse.json({
        success: true,
        data: socialLinks,
      });
    }

    // 分页获取
    if (paginate) {
      const result = await socialLinkService.getSocialLinksPaginated(
        page,
        limit,
        includeInactive
      );
      return NextResponse.json(result);
    }

    // 获取所有活跃的社交链接
    const socialLinks = await socialLinkService.getAllSocialLinks();
    return NextResponse.json({
      success: true,
      data: socialLinks,
    });
  } catch (error) {
    console.error('Error in GET /api/social:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch social links',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social - 创建社交链接
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const { links, ...singleLink } = body;

    // 批量创建社交链接
    if (links && Array.isArray(links)) {
      const result = await socialLinkService.createMultipleSocialLinks(links);
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 400 });
      }
    }

    // 创建单个社交链接
    const createData: CreateSocialLinkRequest = singleLink;
    const result = await socialLinkService.createSocialLink(createData);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/social:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create social link',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/social - 更新社交链接
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const { reorder } = body;

    // 重新排序社交链接
    if (reorder && Array.isArray(reorder)) {
      const result = await socialLinkService.reorderSocialLinks(reorder);
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 400 });
      }
    }

    // 更新单个社交链接
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID is required for update',
        },
        { status: 400 }
      );
    }

    const result = await socialLinkService.updateSocialLink(id, updateData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Error in PUT /api/social:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update social link',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social - 删除社交链接
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
      const result = await socialLinkService.toggleSocialLinkStatus(id);
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 404 });
      }
    }

    // 删除社交链接
    const result = await socialLinkService.deleteSocialLink(id);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 404 });
    }
  } catch (error) {
    console.error('Error in DELETE /api/social:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete social link',
      },
      { status: 500 }
    );
  }
}