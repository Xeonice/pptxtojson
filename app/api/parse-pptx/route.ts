import { NextRequest, NextResponse } from "next/server";
import { pptxParser } from "@/lib/parser/InternalPPTXParser";
import { createCdnStorageService } from "@/lib/services/cdn";

export async function POST(request: NextRequest) {
  console.log("🔄 开始处理 PPTX 解析请求...");

  try {
    // 获取 form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const cdnUrl = formData.get("cdnUrl") as string;

    let fileBuffer: ArrayBuffer;
    let fileName: string;

    // 检查是否提供了 CDN URL
    if (cdnUrl) {
      console.log("☁️ 从 CDN 下载文件:", cdnUrl);
      
      try {
        // 从 CDN 下载文件
        const response = await fetch(cdnUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to download from CDN: ${response.status} ${response.statusText}`);
        }

        fileBuffer = await response.arrayBuffer();
        
        // 从 Content-Disposition 或 URL 中获取文件名
        const contentDisposition = response.headers.get("content-disposition");
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/);
          fileName = filenameMatch ? filenameMatch[1] : "downloaded.pptx";
        } else {
          // 从 URL 中提取文件名
          try {
            const url = new URL(cdnUrl);
            // 从路径中提取文件名，移除路径分隔符
            let pathName = url.pathname;
            const pathParts = pathName.split('/');
            fileName = pathParts[pathParts.length - 1] || "downloaded.pptx";
            
            // 如果从路径无法得到有效文件名，尝试从 URL 片段中提取
            if (!fileName || fileName === "download" || !fileName.includes('.')) {
              // 对于 Vercel Blob URL，文件名可能在路径的其他位置
              for (let i = pathParts.length - 1; i >= 0; i--) {
                if (pathParts[i] && pathParts[i].includes('.pptx')) {
                  fileName = pathParts[i];
                  break;
                }
              }
            }
            
            // 确保有默认文件名
            if (!fileName || !fileName.includes('.')) {
              fileName = "downloaded.pptx";
            }
          } catch (urlError) {
            console.warn("无法解析 URL，使用默认文件名:", urlError);
            fileName = "downloaded.pptx";
          }
        }

        // 验证文件扩展名
        if (!fileName.toLowerCase().endsWith(".pptx")) {
          console.log("❌ CDN 文件类型错误:", fileName);
          throw new Error("Invalid file type. Only .pptx files are supported from CDN.");
        }

        console.log("✅ CDN 文件下载成功:", {
          name: fileName,
          size: fileBuffer.byteLength,
        });
      } catch (cdnError) {
        console.error("❌ CDN 下载失败:", cdnError);
        return NextResponse.json(
          { 
            error: "Failed to download file from CDN",
            details: cdnError instanceof Error ? cdnError.message : String(cdnError)
          },
          { status: 400 }
        );
      }
    } else if (file) {
      // 使用上传的文件
      console.log("📁 接收到文件:", {
        name: file?.name,
        size: file?.size,
        type: file?.type,
      });

      // Check file extension
      if (!file.name?.toLowerCase().endsWith(".pptx")) {
        console.log("❌ 文件类型错误:", file.name);
        return NextResponse.json(
          { error: "Invalid file type. Please upload a .pptx file" },
          { status: 400 }
        );
      }

      fileBuffer = await file.arrayBuffer();
      fileName = file.name;
      console.log("📦 文件转换为 ArrayBuffer, 大小:", fileBuffer.byteLength);
    } else {
      console.log("❌ 没有文件上传或 CDN URL");
      return NextResponse.json(
        { error: "No file uploaded or CDN URL provided" },
        { status: 400 }
      );
    }

    debugger;

    // 获取输出格式参数
    const format = (formData.get("format") as string) || "legacy";
    // 获取 CDN 存储选项
    const useCdn = formData.get("useCdn") === "true";
    const cdnFilename = formData.get("cdnFilename") as string;
    console.log("🎯 输出格式:", format);
    console.log("☁️ 使用 CDN 存储:", useCdn);

    console.log("🔄 开始解析 PPTX 文件...");
    console.log("文件大小:", fileBuffer.byteLength);
    console.log("文件名称:", fileName);
    console.log("输出格式:", format);

    // Parse the PPTX file using our internal parser
    console.log("📊 使用内部解析器解析...");
    const jsonResult = await pptxParser.parseToJSON(fileBuffer);

    console.log("✅ 解析完成");
    console.log("解析结果类型:", typeof jsonResult);
    console.log("解析结果键名:", Object.keys(jsonResult || {}));

    // 调试位置信息
    if (jsonResult && jsonResult.slides && jsonResult.slides.length > 0) {
      const firstSlide = jsonResult.slides[0];
      if (firstSlide.elements && firstSlide.elements.length > 0) {
        console.log("🔍 第一个幻灯片的前3个元素位置:");
        firstSlide.elements.slice(0, 3).forEach((el, idx) => {
          console.log(`元素 ${idx + 1}:`, {
            type: el.type,
            name: el.name,
            left: el.left,
            top: el.top,
            width: el.width,
            height: el.height,
          });
        });
      }
    }

    let response: any = {
      success: true,
      data: jsonResult,
      filename: fileName,
      debug: {
        fileSize: fileBuffer.byteLength,
        resultType: typeof jsonResult,
        resultKeys: Object.keys(jsonResult || {}),
        hasData: !!jsonResult,
      },
    };

    // 如果启用 CDN 存储，上传 JSON 到 CDN
    if (useCdn) {
      try {
        console.log("☁️ 开始上传 JSON 到 CDN...");
        const cdnService = createCdnStorageService();
        
        if (cdnService.isAvailable()) {
          const uploadOptions = {
            filename: cdnFilename || `pptx-result-${Date.now()}.json`,
            contentType: 'application/json',
            access: 'public' as const,
            ttl: 3600 * 24, // 24 hours
            metadata: {
              originalFilename: fileName,
              uploadedAt: new Date().toISOString(),
              format,
            }
          };

          const uploadResult = await cdnService.uploadJSON(jsonResult, uploadOptions);
          
          console.log("✅ JSON 上传到 CDN 成功:", uploadResult.url);
          
          // 替换响应数据为 CDN URL 引用
          response = {
            success: true,
            cdnUrl: uploadResult.url,
            cdnId: uploadResult.id,
            filename: fileName,
            size: uploadResult.size,
            contentType: uploadResult.contentType,
            metadata: uploadResult.metadata,
            debug: {
              fileSize: fileBuffer.byteLength,
              cdnProvider: cdnService.getPrimaryProvider().name,
              uploadedAt: new Date().toISOString(),
            },
          };
        } else {
          console.warn("⚠️ CDN 存储不可用，回退到直接返回 JSON");
        }
      } catch (cdnError) {
        console.error("💥 CDN 上传失败:", cdnError);
        // 添加 CDN 错误信息但继续返回原始数据
        response.cdnError = {
          message: "CDN upload failed, returning JSON directly",
          details: cdnError instanceof Error ? cdnError.message : String(cdnError),
        };
      }
    }

    console.log("🎉 API 响应准备完成");
    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 解析 PPTX 错误:", error);
    return NextResponse.json(
      {
        error: "Failed to parse PPTX file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
