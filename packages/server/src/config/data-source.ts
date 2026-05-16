import { DataSource } from 'typeorm'
import * as path from 'node:path'

export const AppDataSource = new DataSource({
  type: 'sqljs',
  location: path.resolve(__dirname, '..', 'data', 'lottery.db'),
  autoSave: true,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
})