import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class InitialSchema1747350000000 implements MigrationInterface {
  name = 'InitialSchema1747350000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'username', type: 'varchar', isUnique: true },
          { name: 'password', type: 'varchar' },
          { name: 'isAdmin', type: 'boolean', default: 0 },
          { name: 'avatar', type: 'varchar', isNullable: true },
          { name: 'inviteCodeCount', type: 'integer', default: 0 },
          { name: 'createdAt', type: 'datetime', default: "datetime('now')" },
          { name: 'updatedAt', type: 'datetime', default: "datetime('now')" },
        ],
      }),
      true,
    )

    await queryRunner.createTable(
      new Table({
        name: 'invitation_code',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'code', type: 'varchar', isUnique: true },
          { name: 'isUsed', type: 'boolean', default: 0 },
          { name: 'usedById', type: 'integer', isNullable: true },
          { name: 'ownerId', type: 'integer', isNullable: true },
          { name: 'createdAt', type: 'datetime', default: "datetime('now')" },
          { name: 'usedAt', type: 'datetime', isNullable: true },
        ],
      }),
      true,
    )

    await queryRunner.createTable(
      new Table({
        name: 'system_config',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'key', type: 'varchar', isUnique: true },
          { name: 'value', type: 'varchar' },
          { name: 'updatedAt', type: 'datetime', default: "datetime('now')" },
        ],
      }),
      true,
    )

    await queryRunner.createTable(
      new Table({
        name: 'activity',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'name', type: 'varchar', length: '30' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'cover', type: 'varchar', isNullable: true },
          { name: 'mode', type: 'varchar', length: '20' },
          { name: 'status', type: 'varchar', length: '20', default: "'draft'" },
          { name: 'startTime', type: 'datetime', isNullable: true },
          { name: 'endTime', type: 'datetime', isNullable: true },
          { name: 'createdById', type: 'integer' },
          { name: 'createdAt', type: 'datetime', default: "datetime('now')" },
          { name: 'updatedAt', type: 'datetime', default: "datetime('now')" },
        ],
      }),
      true,
    )

    await queryRunner.createTable(
      new Table({
        name: 'prize',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'name', type: 'varchar' },
          { name: 'type', type: 'varchar', length: '20' },
          { name: 'stock', type: 'integer', default: 0 },
          { name: 'weight', type: 'integer', default: 1 },
          { name: 'image', type: 'varchar', isNullable: true },
          { name: 'activityId', type: 'integer' },
          { name: 'createdAt', type: 'datetime', default: "datetime('now')" },
          { name: 'updatedAt', type: 'datetime', default: "datetime('now')" },
        ],
      }),
      true,
    )

    await queryRunner.createTable(
      new Table({
        name: 'draw_record',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'userId', type: 'integer' },
          { name: 'activityId', type: 'integer' },
          { name: 'prizeId', type: 'integer', isNullable: true },
          { name: 'prizeName', type: 'varchar', isNullable: true },
          { name: 'status', type: 'varchar', length: '20', default: "'pending'" },
          { name: 'drawnAt', type: 'datetime', default: "datetime('now')" },
        ],
      }),
      true,
    )

    // Seed defaults
    await queryRunner.query(`
      INSERT INTO system_config (key, value) VALUES
        ('inviteEnabled', 'true'),
        ('initialCodes', '3'),
        ('inviteRewardCodes', '1'),
        ('inviteHint', '## 获取邀请码\\n\\n请联系系统管理员获取邀请码。\\n\\n> 邀请码为注册时必需，每个邀请码只能使用一次。')
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('draw_record')
    await queryRunner.dropTable('prize')
    await queryRunner.dropTable('activity')
    await queryRunner.dropTable('system_config')
    await queryRunner.dropTable('invitation_code')
    await queryRunner.dropTable('user')
  }
}