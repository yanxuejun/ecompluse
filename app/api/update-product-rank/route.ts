import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log('Starting product week rank update via API...');
    
    // 直接调用脚本
    const { spawn } = require('child_process');
    const child = spawn('node', ['scripts/update-product-week-rank.js'], {
      stdio: 'pipe',
      detached: true
    });
    
    child.stdout.on('data', (data: Buffer) => {
      console.log('Script output:', data.toString());
    });
    
    child.stderr.on('data', (data: Buffer) => {
      console.error('Script error:', data.toString());
    });
    
    child.on('close', (code: number) => {
      console.log(`Script finished with code ${code}`);
    });
    
    return NextResponse.json({ 
      message: "Product week rank update started",
      status: "processing"
    });
  } catch (error) {
    console.error('Error starting product week rank update:', error);
    return NextResponse.json({ 
      error: "Failed to start product week rank update" 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || 'US';
    const categoryId = parseInt(searchParams.get('categoryId') || '609');
    
    return NextResponse.json({
      message: "Product week rank API is ready",
      country,
      categoryId,
      note: "Run POST request to start the update process"
    });
  } catch (error) {
    console.error('Error in GET request:', error);
    return NextResponse.json({ 
      error: "Failed to process request" 
    }, { status: 500 });
  }
} 