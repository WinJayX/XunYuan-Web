import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
    }

    // 生成文件名
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `photo_${timestamp}.${ext}`;
    
    // 确保 photos 目录存在
    const photosDir = path.join(process.cwd(), 'public', 'photos');
    try {
      await mkdir(photosDir, { recursive: true });
    } catch {
      // 目录已存在
    }
    
    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(photosDir, fileName);
    await writeFile(filePath, buffer);
    
    return NextResponse.json({ 
      success: true, 
      fileName,
      path: `/photos/${fileName}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
