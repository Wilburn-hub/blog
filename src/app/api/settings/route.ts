import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SettingService } from '@/lib/services/setting.service';
import { ApiResponse } from '@/types/about';

const prisma = new PrismaClient();
const settingService = new SettingService(prisma);

/**
 * GET /api/settings - 获取所有设置
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const keys = searchParams.get('keys');
    const personal = searchParams.get('personal');
    const site = searchParams.get('site');

    // 获取指定的设置
    if (keys) {
      const keyArray = keys.split(',').map(key => key.trim());
      const settings = await settingService.getSettings(keyArray);
      return NextResponse.json({
        success: true,
        data: settings,
      });
    }

    // 获取个人信息
    if (personal === 'true') {
      const personalInfo = await settingService.getPersonalInfo();
      return NextResponse.json({
        success: true,
        data: personalInfo,
      });
    }

    // 获取网站信息
    if (site === 'true') {
      const siteInfo = await settingService.getSiteInfo();
      return NextResponse.json({
        success: true,
        data: siteInfo,
      });
    }

    // 获取所有设置
    const settings = await settingService.getAllSettings();
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch settings',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings - 创建或更新设置
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const { key, value, type } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Key and value are required',
        },
        { status: 400 }
      );
    }

    const setting = await settingService.upsertSetting(key, value, type || 'STRING');
    return NextResponse.json({
      success: true,
      data: setting,
      message: 'Setting saved successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save setting',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings - 批量更新设置
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const { settings, personalInfo } = body;

    // 批量更新设置
    if (settings && Array.isArray(settings)) {
      const result = await settingService.upsertMultipleSettings(settings);
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Settings updated successfully',
      });
    }

    // 更新个人信息
    if (personalInfo && typeof personalInfo === 'object') {
      const result = await settingService.updatePersonalInfo(personalInfo);
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Personal information updated successfully',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request body. Provide either "settings" array or "personalInfo" object.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PUT /api/settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update settings',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings - 删除设置
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: 'Key parameter is required',
        },
        { status: 400 }
      );
    }

    const success = await settingService.deleteSetting(key);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Setting deleted successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Setting not found or could not be deleted',
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in DELETE /api/settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete setting',
      },
      { status: 500 }
    );
  }
}