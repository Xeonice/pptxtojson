import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export async function POST(request: NextRequest) {
  console.log("🔄 处理客户端 CDN 上传请求...");

  try {
    const body = (await request.json()) as HandleUploadBody;

    // 处理客户端上传
    // 这个函数会生成一个安全的客户端上传 URL
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // 在这里可以添加自定义验证逻辑
        // 例如：检查用户权限、文件类型等
        console.log("📝 准备生成上传 token for:", pathname);
        
        // 验证文件扩展名
        const allowedExtensions = ['.pptx', '.json'];
        const hasValidExtension = allowedExtensions.some(ext => 
          pathname.toLowerCase().endsWith(ext)
        );
        
        if (!hasValidExtension) {
          throw new Error('Invalid file type. Only .pptx and .json files are allowed.');
        }

        const config = {
          allowedContentTypes: [
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/json',
            'application/octet-stream'
          ],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          addRandomSuffix: true, // 避免文件名冲突
          allowOverwrite: false, // 明确禁止覆盖，强制使用随机后缀
        };
        
        console.log("🔧 返回配置:", config);
        return config;
      },
      onUploadCompleted: async ({ blob }) => {
        // 文件上传完成后的处理
        console.log('✅ 文件上传完成:', blob.pathname);
        console.log('📊 文件信息:', {
          url: blob.url,
          contentType: blob.contentType,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("💥 处理上传请求错误:", error);
    return NextResponse.json(
      {
        error: "Failed to handle upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}