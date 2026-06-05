ALTER TABLE "lancamentos" ADD COLUMN "intervalo_recorrencia" text DEFAULT 'Mensal';--> statement-breakpoint
ALTER TABLE "preferencias_usuario" DROP COLUMN "extrato_note_as_column";--> statement-breakpoint
ALTER TABLE "preferencias_usuario" DROP COLUMN "lancamentos_column_order";