import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@Controller()
export class FrontendController {
  private readonly publicPaths = [
    path.resolve(process.cwd(), 'frontend/out'),
    path.resolve(__dirname, '../../frontend/out'),
    path.resolve(__dirname, '../public'),
    path.resolve(__dirname, '../../src/public'),
    path.resolve(process.cwd(), 'src/public'),
    path.resolve(process.cwd(), 'dist/public'),
  ];

  private getPublicDir(): string {
    const found = this.publicPaths.find((p) => fs.existsSync(p));
    return found || path.resolve(process.cwd(), 'frontend/out');
  }

  @Get(['reports', 'reports.html'])
  serveReports(@Res() res: Response) {
    const publicDir = this.getPublicDir();
    const reportsCandidates = [
      path.join(publicDir, 'reports.html'),
      path.join(publicDir, 'reports', 'index.html'),
      path.join(publicDir, 'index.html'),
    ];

    const file = reportsCandidates.find((f) => fs.existsSync(f));
    if (file) {
      return res.sendFile(file);
    }
    return res.redirect('/');
  }

  @Get('*')
  serveSpa(@Req() req: Request, @Res() res: Response) {
    const url = req.path;

    // Do not intercept API or docs routes
    if (url.startsWith('/api') || url.startsWith('/ws') || url.startsWith('/docs')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    const publicDir = this.getPublicDir();
    const filePath = path.join(publicDir, url.replace(/^\//, ''));

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }

    // Default SPA fallback
    const indexHtml = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexHtml)) {
      return res.sendFile(indexHtml);
    }

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>SafShekan NestJS Backend</title>
          <style>body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }</style>
        </head>
        <body>
          <h1>⚡ صف‌شکن (SafShekan) NestJS Backend</h1>
          <p>بک‌اند با موفقیت در حال اجراست.</p>
          <p><a href="/api/docs" style="color: #38bdf8;">مشاهده مستندات Swagger API</a></p>
        </body>
      </html>
    `);
  }
}
