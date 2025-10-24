import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTypeMenu } from './user-type-menu.entity';
import { TypeMenuModule } from 'src/type_menu/type_menu.module';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [TypeOrmModule.forFeature([UserTypeMenu, TypeMenuModule, UserModule])],
    // controllers: [UserTypeMenuController], // (à ajouter plus tard si tu crées un contrôleur)
    // providers: [UserTypeMenuService], // (à ajouter plus tard si tu crées un service)
    // exports: [UserTypeMenuService], // (à exporter si utilisé ailleurs)
})
export class UserTypeMenuModule { }
