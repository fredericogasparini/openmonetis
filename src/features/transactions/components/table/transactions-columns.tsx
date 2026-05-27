import {
	RiAttachment2,
	RiBankCard2Line,
	RiChat1Line,
	RiCheckboxBlankCircleLine,
	RiCheckboxCircleFill,
	RiCheckLine,
	RiDeleteBin5Line,
	RiFileCopyLine,
	RiFileList2Line,
	RiGroupLine,
	RiHistoryLine,
	RiMoreFill,
	RiPencilLine,
	RiRefundLine,
	RiTimeLine,
} from "@remixicon/react";
import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
	CREDIT_CARD_PAYMENT_METHOD,
	SETTLEABLE_PAYMENT_METHODS,
} from "@/features/transactions/lib/constants";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Spinner } from "@/shared/components/ui/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { REFUND_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { getAvatarSrc } from "@/shared/lib/payers/utils";
import { formatDate } from "@/shared/utils/date";
import { getConditionIcon, getPaymentMethodIcon } from "@/shared/utils/icons";
import { cn } from "@/shared/utils/ui";
import type { TransactionItem } from "../types";

function TruncatedDescription({ name }: { name: string }) {
	const textRef = useRef<HTMLSpanElement>(null);
	const [isTruncated] = useState(false);
	const content = (
		<span ref={textRef} className="font-medium truncate block">
			{name}
		</span>
	);

	if (isTruncated) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>{content}</TooltipTrigger>
				<TooltipContent side="top" className="max-w-xs">
					{name}
				</TooltipContent>
			</Tooltip>
		);
	}
	return content;
}

type BuildColumnsArgs = {
	currentUserId: string;
	noteAsColumn: boolean;
	onEdit?: (item: TransactionItem) => void;
	onCopy?: (item: TransactionItem) => void;
	onImport?: (item: TransactionItem) => void;
	onConfirmDelete?: (item: TransactionItem) => void;
	onViewDetails?: (item: TransactionItem) => void;
	onRefund?: (item: TransactionItem) => void;
	onToggleSettlement?: (item: TransactionItem) => void;
	onAnticipate?: (item: TransactionItem) => void;
	onViewAnticipationHistory?: (item: TransactionItem) => void;
	isSettlementLoading: (id: string) => boolean;
	showActions: boolean;
	columnOrder?: string[] | null;
};

function getPaymentMethodTableLabel(method: string) {
	if (method === "Transferência bancária") return "Transf. bancária";
	return method;
}

export function getTransactionColumns({
	currentUserId,
	onEdit,
	onCopy,
	onImport,
	onConfirmDelete,
	onViewDetails,
	onRefund,
	onToggleSettlement,
	onAnticipate,
	onViewAnticipationHistory,
	isSettlementLoading,
	showActions,
}: BuildColumnsArgs): ColumnDef<TransactionItem>[] {
	const noop = () => undefined;
	const handleEdit = onEdit ?? noop;
	const handleCopy = onCopy ?? noop;
	const handleImport = onImport ?? noop;
	const handleConfirmDelete = onConfirmDelete ?? noop;
	const handleViewDetails = onViewDetails ?? noop;
	const handleRefund = onRefund ?? noop;
	const handleToggleSettlement = onToggleSettlement ?? noop;
	const handleAnticipate = onAnticipate ?? noop;
	const handleViewAnticipationHistory = onViewAnticipationHistory ?? noop;

	const columns: ColumnDef<TransactionItem>[] = [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Selecionar todos"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Selecionar linha"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "purchaseDate",
			accessorKey: "purchaseDate",
			header: () => null,
			cell: () => null,
		},
		{
			id: "description",
			accessorKey: "name",
			header: "Descrição",
			size: 300,
			cell: ({ row }) => {
				const {
					name,
					installmentCount,
					currentInstallment,
					paymentMethod,
					dueDate,
					note,
					isDivided,
					isAnticipated,
					hasAttachments,
					categoriaName,
					categoriaIcon,
				} = row.original;

				const installmentBadge =
					currentInstallment && installmentCount
						? `${currentInstallment}/${installmentCount}`
						: null;

				const isBoleto = paymentMethod === "Boleto" && dueDate;
				const dueDateLabel =
					isBoleto && dueDate ? `Venc. ${formatDate(dueDate)}` : null;
				const hasNote = Boolean(note?.trim().length);
				const isLastInstallment =
					currentInstallment === installmentCount &&
					installmentCount &&
					installmentCount > 1;

				return (
					<div className="flex items-center gap-3 min-w-0">
						<Tooltip>
							<TooltipTrigger className="cursor-default rounded-full shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
								<CategoryIconBadge
									icon={categoriaIcon}
									name={categoriaName ?? "Sem categoria"}
									size="sm"
								/>
							</TooltipTrigger>
							<TooltipContent side="top">
								<p>{categoriaName ?? "Sem categoria"}</p>
							</TooltipContent>
						</Tooltip>
						<div className="flex flex-col py-0.5 min-w-0">
							<div className="flex items-center gap-1.5 min-w-0">
								<TruncatedDescription name={name} />

								{isDivided && (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="inline-flex rounded-full p-0.5 shrink-0">
												<RiGroupLine
													size={16}
													className="text-muted-foreground"
													aria-hidden
												/>
												<span className="sr-only">Dividido entre pessoas</span>
											</span>
										</TooltipTrigger>
										<TooltipContent side="top">
											Dividido entre pessoas
										</TooltipContent>
									</Tooltip>
								)}

								{isLastInstallment ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="inline-flex p-0.5 shrink-0">
												<Image
													src="/icons/party.svg"
													alt="Última parcela"
													width={16}
													height={16}
													className="h-4 w-4"
												/>
												<span className="sr-only">Última parcela</span>
											</span>
										</TooltipTrigger>
										<TooltipContent side="top">Última parcela!</TooltipContent>
									</Tooltip>
								) : null}

								{installmentBadge ? (
									<Badge
										variant="secondary"
										className="px-1.5 py-0 text-[10px] h-4 leading-4 shrink-0"
									>
										{installmentBadge}
									</Badge>
								) : null}

								{isAnticipated && (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="inline-flex rounded-full p-0.5 shrink-0">
												<RiTimeLine
													size={16}
													className="text-muted-foreground"
													aria-hidden
												/>
												<span className="sr-only">Parcela antecipada</span>
											</span>
										</TooltipTrigger>
										<TooltipContent side="top">
											Parcela antecipada
										</TooltipContent>
									</Tooltip>
								)}

								{hasNote ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="inline-flex rounded-full p-0.5 hover:bg-accent transition-colors duration-300 shrink-0">
												<RiChat1Line
													className="h-4 w-4 text-muted-foreground"
													aria-hidden
												/>
												<span className="sr-only">Ver anotação</span>
											</span>
										</TooltipTrigger>
										<TooltipContent
											side="top"
											align="start"
											className="max-w-xs whitespace-pre-line"
										>
											{note}
										</TooltipContent>
									</Tooltip>
								) : null}

								{hasAttachments ? (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="inline-flex rounded-full p-0.5 shrink-0">
												<RiAttachment2
													className="h-4 w-4 text-muted-foreground"
													aria-hidden
												/>
												<span className="sr-only">Possui anexos</span>
											</span>
										</TooltipTrigger>
										<TooltipContent side="top">Possui anexos</TooltipContent>
									</Tooltip>
								) : null}
							</div>
							{dueDateLabel && (
								<span className="text-[10px] text-destructive font-medium shrink-0">
									{dueDateLabel}
								</span>
							)}
						</div>
					</div>
				);
			},
		},
		{
			id: "person",
			accessorKey: "pagadorName",
			header: "Pessoa",
			size: 150,
			cell: ({ row }) => {
				const { payerId, pagadorName, pagadorAvatar } = row.original;
				const label = pagadorName?.trim() || "Sem pessoa";
				const displayName = label.split(/\s+/)[0] ?? label;
				const avatarSrc = getAvatarSrc(pagadorAvatar);
				const initial = displayName.charAt(0).toLowerCase() || "?";
				const content = (
					<div className="flex items-center gap-2">
						<Avatar className="size-8">
							<AvatarImage src={avatarSrc} alt={`Avatar de ${label}`} />
							<AvatarFallback className="text-[10px] font-medium uppercase">
								{initial}
							</AvatarFallback>
						</Avatar>
						<span className="truncate text-sm">{displayName}</span>
					</div>
				);
				if (!payerId) {
					return content;
				}
				return (
					<Link
						href={`/payers/${payerId}`}
						className="inline-block hover:underline"
						title={label}
					>
						{content}
					</Link>
				);
			},
		},
		{
			id: "accountCard",
			header: "Conta/Cartão",
			cell: ({ row }) => {
				const {
					cartaoName,
					contaName,
					cartaoLogo,
					contaLogo,
					cardId,
					accountId,
					userId,
					condition,
				} = row.original;

				const isCartao = Boolean(cartaoName);
				const label = cartaoName ?? contaName ?? "Desconhecido";
				const logoSrc = resolveLogoSrc(cartaoLogo ?? contaLogo);
				const href = cardId
					? `/cards/${cardId}/invoice`
					: accountId
						? `/accounts/${accountId}/statement`
						: null;
				const isOwnData = userId === currentUserId;
				const condIcon = getConditionIcon(condition);

				const content = (
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"flex items-center text-muted-foreground w-4",
								condition === "À vista" && "invisible",
							)}
							title={condition !== "À vista" ? condition : undefined}
						>
							{condition !== "À vista" && condIcon}
						</div>

						<div className="flex items-center gap-1.5">
							{logoSrc && (
								<Avatar className="size-8 rounded-full">
									<AvatarImage src={logoSrc} alt={`Logo de ${label}`} />
									<AvatarFallback className="text-[9px] font-medium uppercase rounded-full">
										{label.substring(0, 2)}
									</AvatarFallback>
								</Avatar>
							)}
							<span
								className={cn(
									"truncate text-sm underline-offset-2",
									isOwnData && href && "group-hover:underline",
								)}
							>
								{label}
							</span>
						</div>
					</div>
				);

				if (!isOwnData || !href) {
					return (
						<Tooltip>
							<TooltipTrigger asChild>
								<div>{content}</div>
							</TooltipTrigger>
							<TooltipContent side="top">
								{condition} • {isCartao ? "Cartão" : "Conta"}: {label}
							</TooltipContent>
						</Tooltip>
					);
				}

				return (
					<Tooltip>
						<TooltipTrigger asChild>
							<Link href={href} className="group inline-block">
								{content}
							</Link>
						</TooltipTrigger>
						<TooltipContent side="top">
							{condition} • {isCartao ? "Cartão" : "Conta"}: {label}
						</TooltipContent>
					</Tooltip>
				);
			},
		},
		{
			id: "paymentMethod",
			accessorKey: "paymentMethod",
			header: "Pagamento",
			size: 140,
			cell: ({ row }) => {
				const method = row.original.paymentMethod;
				const icon = getPaymentMethodIcon(method);
				return (
					<div
						className="flex items-center gap-1.5 text-sm min-w-0"
						title={method}
					>
						<span className="shrink-0">{icon}</span>
						<span className="truncate block">
							{getPaymentMethodTableLabel(method)}
						</span>
					</div>
				);
			},
		},
		{
			id: "amount",
			accessorKey: "amount",
			header: "Valor",
			size: 120,
			cell: ({ row }) => {
				const isReceita = row.original.transactionType === "Receita";
				const isTransfer = row.original.transactionType === "Transferência";
				const isIncomingTransfer =
					isTransfer && Number(row.original.amount) > 0;
				return (
					<div className="text-right flex justify-end">
						<MoneyValues
							amount={row.original.amount}
							showPositiveSign={isReceita || isIncomingTransfer}
							className={cn(
								"whitespace-nowrap font-medium",
								isReceita ? "text-success" : "text-foreground",
								isTransfer && "text-info",
							)}
						/>
					</div>
				);
			},
		},
	];

	if (showActions) {
		columns.push({
			id: "actions",
			header: "Ações",
			size: 100,
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center justify-end gap-1">
					{(() => {
						const paymentMethod = row.original.paymentMethod;
						const isCreditCard = paymentMethod === CREDIT_CARD_PAYMENT_METHOD;
						const canToggleSettlement = (
							SETTLEABLE_PAYMENT_METHODS as readonly string[]
						).includes(paymentMethod);

						if (!canToggleSettlement && !isCreditCard) return null;

						if (isCreditCard) {
							const invoicePaid = Boolean(row.original.isSettled);
							return (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="inline-flex">
											<Button
												variant="ghost"
												size="icon-sm"
												disabled
												className={cn(
													"transition-colors size-8",
													invoicePaid
														? "bg-success/10 text-success"
														: "text-muted-foreground/30",
												)}
											>
												{invoicePaid ? (
													<RiCheckboxCircleFill className="size-4" />
												) : (
													<RiBankCard2Line className="size-4" />
												)}
												<span className="sr-only">
													{invoicePaid
														? "Fatura paga"
														: "Lançamento de cartão de crédito"}
												</span>
											</Button>
										</span>
									</TooltipTrigger>
									<TooltipContent side="top" className="max-w-48 text-center">
										{invoicePaid
											? "Fatura paga"
											: "Lançamentos de cartão de crédito são liquidados ao pagar a fatura"}
									</TooltipContent>
								</Tooltip>
							);
						}

						const readOnly = row.original.readonly;
						const loading = isSettlementLoading(row.original.id);
						const settled = Boolean(row.original.isSettled);

						return (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => handleToggleSettlement(row.original)}
										disabled={loading || readOnly}
										className={cn(
											"transition-colors size-8",
											settled
												? "bg-success/10 text-success hover:bg-success/20 hover:text-success"
												: "text-muted-foreground hover:text-foreground",
										)}
									>
										{loading ? (
											<Spinner className="size-4" />
										) : settled ? (
											<RiCheckboxCircleFill className="size-4" />
										) : (
											<RiCheckboxBlankCircleLine className="size-4" />
										)}
										<span className="sr-only">
											{settled ? "Desfazer pagamento" : "Marcar como pago"}
										</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent side="top">
									{settled ? "Desfazer pagamento" : "Marcar como pago"}
								</TooltipContent>
							</Tooltip>
						);
					})()}

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon-sm" className="size-8">
								<RiMoreFill className="size-4" />
								<span className="sr-only">Abrir ações do lançamento</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44">
							<DropdownMenuItem
								onSelect={() => handleViewDetails(row.original)}
							>
								<RiFileList2Line className="size-4" />
								Detalhes
							</DropdownMenuItem>
							{row.original.userId === currentUserId && (
								<DropdownMenuItem
									onSelect={() => handleEdit(row.original)}
									disabled={row.original.readonly}
								>
									<RiPencilLine className="size-4" />
									Editar
								</DropdownMenuItem>
							)}
							{!row.original.readonly &&
								row.original.userId === currentUserId && (
									<DropdownMenuItem onSelect={() => handleCopy(row.original)}>
										<RiFileCopyLine className="size-4" />
										Copiar
									</DropdownMenuItem>
								)}
							{!row.original.readonly &&
								row.original.userId !== currentUserId && (
									<DropdownMenuItem onSelect={() => handleImport(row.original)}>
										<RiFileCopyLine className="size-4" />
										Importar para Minha Conta
									</DropdownMenuItem>
								)}
							{(() => {
								const item = row.original;
								const canRefund =
									item.userId === currentUserId &&
									item.transactionType === "Despesa" &&
									item.condition === "À vista" &&
									!item.splitGroupId &&
									!item.readonly &&
									!item.note?.startsWith(REFUND_NOTE_PREFIX);

								if (!canRefund) return null;

								return (
									<DropdownMenuItem onSelect={() => handleRefund(item)}>
										<RiRefundLine className="size-4" />
										Reembolso
									</DropdownMenuItem>
								);
							})()}
							{row.original.userId === currentUserId && (
								<DropdownMenuItem
									variant="destructive"
									onSelect={() => handleConfirmDelete(row.original)}
									disabled={row.original.readonly}
								>
									<RiDeleteBin5Line className="size-4" />
									Remover
								</DropdownMenuItem>
							)}

							{row.original.userId === currentUserId &&
								row.original.condition === "Parcelado" &&
								row.original.seriesId && (
									<>
										<DropdownMenuSeparator />

										{!row.original.isAnticipated && onAnticipate && (
											<DropdownMenuItem
												onSelect={() => handleAnticipate(row.original)}
											>
												<RiTimeLine className="size-4" />
												Antecipar Parcelas
											</DropdownMenuItem>
										)}

										{onViewAnticipationHistory && (
											<DropdownMenuItem
												onSelect={() =>
													handleViewAnticipationHistory(row.original)
												}
											>
												<RiHistoryLine className="size-4" />
												Histórico de Antecipações
											</DropdownMenuItem>
										)}

										{row.original.isAnticipated && (
											<DropdownMenuItem disabled>
												<RiCheckLine className="size-4 text-success" />
												Parcela Antecipada
											</DropdownMenuItem>
										)}
									</>
								)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		});
	}

	return columns;
}
