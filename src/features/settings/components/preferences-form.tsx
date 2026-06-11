"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePreferencesAction } from "@/features/settings/actions";
import {
	ATTACHMENT_SIZE_OPTIONS,
	type AttachmentSizeOption,
} from "@/features/transactions/lib/attachments-config";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Switch } from "@/shared/components/ui/switch";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@/shared/components/ui/toggle-group";

interface PreferencesFormProps {
	attachmentMaxSizeMb: number;
	showTransactionSummary: boolean;
}

export function PreferencesForm({
	attachmentMaxSizeMb: initialAttachmentMaxSizeMb,
	showTransactionSummary: initialShowTransactionSummary,
}: PreferencesFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [attachmentMaxSizeMb, setAttachmentMaxSizeMb] =
		useState<AttachmentSizeOption>(
			(ATTACHMENT_SIZE_OPTIONS.includes(
				initialAttachmentMaxSizeMb as AttachmentSizeOption,
			)
				? initialAttachmentMaxSizeMb
				: 50) as AttachmentSizeOption,
		);
	const [showTransactionSummary, setShowTransactionSummary] = useState(
		initialShowTransactionSummary,
	);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		startTransition(async () => {
			const result = await updatePreferencesAction({
				attachmentMaxSizeMb,
				showTransactionSummary,
			});

			if (result.success) {
				toast.success(result.message);
				router.refresh();
			} else {
				toast.error(result.error);
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-8">
			{/* Seção: Lançamentos */}
			<section className="space-y-4">
				<div>
					<h3 className="text-base font-semibold">Lançamentos</h3>
					<p className="text-sm text-muted-foreground">
						Configurações de exibição da tabela de movimentações.
					</p>
				</div>

				<section className="flex items-start justify-between">
					<div className="space-y-2">
						<Label htmlFor="show-transaction-summary" className="text-sm">
							Resumo da operação
						</Label>
						<p className="text-sm text-muted-foreground">
							Exibe um resumo dos dados preenchidos no final do modal de
							lançamento.
						</p>
					</div>
					<Switch
						id="show-transaction-summary"
						checked={showTransactionSummary}
						onCheckedChange={setShowTransactionSummary}
						disabled={isPending}
					/>
				</section>

				<Separator />

				<section className="space-y-2">
					<Label className="text-sm">Anexos</Label>
					<p className="text-sm text-muted-foreground">
						Configurações de upload de arquivos nos lançamentos.
					</p>

					<div className="space-y-2 max-w-md mt-4">
						<Label>Tamanho máximo por arquivo</Label>
						<p className="text-sm text-muted-foreground">
							Limite aplicado ao upload de PDFs e imagens.
						</p>
						<ToggleGroup
							type="single"
							value={String(attachmentMaxSizeMb)}
							onValueChange={(val) => {
								if (val)
									setAttachmentMaxSizeMb(Number(val) as AttachmentSizeOption);
							}}
							className="flex flex-wrap gap-2 justify-start"
						>
							{ATTACHMENT_SIZE_OPTIONS.map((size) => (
								<ToggleGroupItem
									key={size}
									value={String(size)}
									aria-label={`${size} MB`}
									className="min-w-14"
								>
									{size} MB
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</div>
				</section>
			</section>

			<div className="flex justify-end">
				<Button type="submit" disabled={isPending} className="w-fit">
					{isPending ? "Salvando..." : "Salvar preferências"}
				</Button>
			</div>
		</form>
	);
}
