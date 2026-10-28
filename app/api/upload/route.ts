import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const bucket = formData.get('bucket') as string || 'uploads'
    const folder = formData.get('folder') as string || 'general'

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      )
    }

    const uploadedFiles = []

    for (const file of files) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} is too large (max 10MB)` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
          { success: false, error: `Failed to upload ${file.name}` },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      uploadedFiles.push({
        id: data.path,
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { success: false, error: "Failed to upload files" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { fileId, bucket = 'uploads' } = await request.json()

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "File ID required" },
        { status: 400 }
      )
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileId])

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { success: false, error: "Failed to delete file" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully"
    })

  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json(
      { success: false, error: "Failed to delete file" },
      { status: 500 }
    )
  }
}