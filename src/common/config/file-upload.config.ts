// src/common/config/file-upload.config.ts
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors } from '@nestjs/common';

export function UploadImageInterceptor(folder: string) {
    return UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: `./uploads/${folder}`,
                filename: (req, file, callback) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    callback(null, `${uniqueSuffix}${ext}`);
                },
            }),
        }),
    );
}
