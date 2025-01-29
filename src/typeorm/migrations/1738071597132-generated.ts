import { MigrationInterface, QueryRunner } from "typeorm";

export class Generated1738071597132 implements MigrationInterface {
    name = 'Generated1738071597132'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6bbe63d2fe75e7f0ba1710351d" ON "refresh_token" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "mimetype" character varying NOT NULL, "path" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "commentId" uuid, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(), "userId" uuid, "parentCommentId" uuid, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_comment_id" ON "comments" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_comment_user_id" ON "comments" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_comment_parent_id" ON "comments" ("parentCommentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_comment_created_at" ON "comments" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying NOT NULL, "home_page" character varying, "encrypted_password" character varying NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_6bbe63d2fe75e7f0ba1710351d4" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_8da1f7d61abff217a394bcc4c83" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_4875672591221a61ace66f2d4f9" FOREIGN KEY ("parentCommentId") REFERENCES "comments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_4875672591221a61ace66f2d4f9"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_8da1f7d61abff217a394bcc4c83"`);
        await queryRunner.query(`ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_6bbe63d2fe75e7f0ba1710351d4"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_parent_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comment_id"`);
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6bbe63d2fe75e7f0ba1710351d"`);
        await queryRunner.query(`DROP TABLE "refresh_token"`);
    }

}
