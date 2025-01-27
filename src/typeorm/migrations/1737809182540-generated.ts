import { MigrationInterface, QueryRunner } from "typeorm";

export class Generated1737809182540 implements MigrationInterface {
    name = 'Generated1737809182540'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(), "userId" uuid, "parentCommentId" uuid, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_comment_id" ON "comments" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_comment_user_id" ON "comments" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_comment_parent_id" ON "comments" ("parentCommentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_comment_created_at" ON "comments" ("created_at") `);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_4875672591221a61ace66f2d4f9" FOREIGN KEY ("parentCommentId") REFERENCES "comments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_4875672591221a61ace66f2d4f9"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_parent_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_id"`);
        await queryRunner.query(`DROP TABLE "comments"`);
    }

}
