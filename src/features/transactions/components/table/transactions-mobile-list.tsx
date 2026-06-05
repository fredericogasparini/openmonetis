"use client";

import {
    RiGroupLine,
    RiLoader2Fill,
    RiRefreshLine,
    RiTimeLine,
} from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { CategoryIconBadge } from "@/shared/components/entity-avatar";
import MoneyValues from "@/shared/components/money-values";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { getAvatarSrc } from "@/shared/lib/payers/utils";
import { formatDate } from "@/shared/utils/date";
import { cn } from "@/shared/utils/ui";
import type { TransactionItem } from "../types";
import { TransactionActionsMenu } from "./transaction-actions-menu";
import { TransactionSettlementButton } from "./transaction-settlement-button";

type TransactionsMobileListProps = {
    data: TransactionItem[];
    currentUserId: string;
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
    showActions?: boolean;
};

function formatGroupDate(dateStr: string) {
    if (!dateStr) return "Desconhecido";
    const formatted = formatDate(dateStr);
    return formatted.charAt(0).toLowerCase() + formatted.slice(1);
}

export function TransactionsMobileList({
    data,
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
    showActions = true,
}: TransactionsMobileListProps) {
    const groupedItems = useMemo(() => {
        const groups: {
            date: string;
            label: string;
            items: TransactionItem[];
        }[] = [];
        const dateMap = new Map<string, TransactionItem[]>();

        for (const item of data) {
            const date = item.purchaseDate || "Unknown";

            if (!dateMap.has(date)) {
                const groupItems: TransactionItem[] = [];
                dateMap.set(date, groupItems);
                groups.push({ date, label: formatGroupDate(date), items: groupItems });
            }

            const groupItems = dateMap.get(date);
            groupItems?.push(item);
        }

        return groups;
    }, [data]);

    return (
        <div className="space-y-3 md:hidden">
            {groupedItems.map((group) => (
                <div key={group.date} className="space-y-2">
                    <div className="text-sm text-muted-foreground pt-3 first:pt-0">
                        {group.label}
                    </div>
                    <div className="border-b border-border/60" />
                    <div className="space-y-2 pt-1">
                        {group.items.map((item) => (
                            <TransactionMobileRow
                                key={item.id}
                                item={item}
                                currentUserId={currentUserId}
                                onEdit={onEdit}
                                onCopy={onCopy}
                                onImport={onImport}
                                onConfirmDelete={onConfirmDelete}
                                onViewDetails={onViewDetails}
                                onRefund={onRefund}
                                onToggleSettlement={onToggleSettlement}
                                onAnticipate={onAnticipate}
                                onViewAnticipationHistory={onViewAnticipationHistory}
                                isSettlementLoading={isSettlementLoading}
                                showActions={showActions}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

type TransactionMobileRowProps = Omit<TransactionsMobileListProps, "data"> & {
    item: TransactionItem;
};

function TransactionMobileRow({
    item,
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
    showActions = true,
}: TransactionMobileRowProps) {
    const {
        name,
        installmentCount,
        currentInstallment,
        paymentMethod,
        dueDate,
        isDivided,
        isAnticipated,
        categoriaName,
        categoriaIcon,
        pagadorName,
        pagadorAvatar,
        payerId,
        cartaoName,
        contaName,
        cartaoLogo,
        contaLogo,
        cardId,
        accountId,
        userId,
        condition,
    } = item;

    const installmentBadge = currentInstallment && installmentCount ? `${currentInstallment}/${installmentCount}` : null;
    const isBoleto = paymentMethod === "Boleto" && dueDate;
    const dueDateLabel = isBoleto && dueDate ? `Venc. ${formatDate(dueDate)}` : null;
    const isLastInstallment = currentInstallment === installmentCount && installmentCount && installmentCount > 1;

    const isReceita = item.transactionType === "Receita";
    const isTransfer = item.transactionType === "Transferência";
    const isIncomingTransfer = isTransfer && Number(item.amount) > 0;

    const payerLabel = pagadorName?.trim() || "Sem pessoa";
    const payerDisplayName = payerLabel.split(/\s+/)[0] ?? payerLabel;
    const payerAvatarSrc = getAvatarSrc(pagadorAvatar);
    const payerInitial = payerDisplayName.charAt(0).toLowerCase() || "?";

    const accountLabel = cartaoName ?? contaName ?? "Desconhecido";
    const logoSrc = resolveLogoSrc(cartaoLogo ?? contaLogo);

    const isOwnData = userId === currentUserId;
    const accountHref = cardId ? `/cards/${cardId}/invoice` : accountId ? `/accounts/${accountId}/statement` : null;

    const isOverdue = isBoleto && !item.isSettled && new Date(dueDate) < new Date();
    const isParcelado = condition === "Parcelado";
    const isRecorrente = condition === "Recorrente";

    const accountContent = (
        <div className="flex items-center gap-1.5 min-w-0">
            {logoSrc && (
                <Avatar className="size-4 rounded-full shrink-0">
                    <AvatarImage src={logoSrc} alt={`Logo de ${accountLabel}`} />
                    <AvatarFallback className="text-[7px] font-medium uppercase">
                        {accountLabel.substring(0, 2)}
                    </AvatarFallback>
                </Avatar>
            )}
            <span className={cn("truncate", isOwnData && accountHref && "underline-offset-2")}>
                {accountLabel}
            </span>
        </div>
    );

    const payerContent = (
        <div className="flex items-center gap-1.5 min-w-0">
            <Avatar className="size-4 shrink-0">
                <AvatarImage src={payerAvatarSrc} alt={`Avatar de ${payerLabel}`} />
                <AvatarFallback className="text-[7px] font-medium uppercase">
                    {payerInitial}
                </AvatarFallback>
            </Avatar>
            <span className="truncate">{payerDisplayName}</span>
        </div>
    );

    return (
        <article
            className={cn(
                "flex items-start gap-3 py-1 px-1 transition-colors",
                isOverdue && "bg-destructive/5"
            )}
        >
            <div className="relative shrink-0 mt-0.5">
                <Tooltip>
                    <TooltipTrigger className="cursor-default focus-visible:outline-none">
                        <CategoryIconBadge
                            icon={categoriaIcon}
                            name={categoriaName ?? "Sem categoria"}
                            size="md"
                        />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>{categoriaName ?? "Sem categoria"}</p>
                    </TooltipContent>
                </Tooltip>
                {(isParcelado || isRecorrente) && (
                    <div
                        className="absolute -bottom-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-white text-black"
                        aria-hidden
                    >
                        {isParcelado ? (
                            <RiLoader2Fill className="size-3.5" />
                        ) : (
                            <RiRefreshLine className="size-3.5" />
                        )}
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="truncate text-sm font-medium text-foreground">
                        {name}
                    </span>
                    
                    {isDivided && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="inline-flex rounded-full shrink-0">
                                    <RiGroupLine size={14} className="text-muted-foreground" aria-hidden />
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">Dividido entre pessoas</TooltipContent>
                        </Tooltip>
                    )}

                    {isLastInstallment && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="inline-flex shrink-0">
                                    <Image src="/icons/party.svg" alt="Última parcela" width={14} height={14} />
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">Última parcela!</TooltipContent>
                        </Tooltip>
                    )}

                    {installmentBadge && (
                        <span className="inline-flex shrink-0 items-center text-xs font-medium text-muted-foreground">
                            {installmentBadge}
                        </span>
                    )}

                    {isAnticipated && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="inline-flex rounded-full shrink-0">
                                    <RiTimeLine size={14} className="text-muted-foreground" aria-hidden />
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">Parcela antecipada</TooltipContent>
                        </Tooltip>
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                    {isOwnData && accountHref ? (
                        <Link href={accountHref} className="min-w-0 truncate hover:text-foreground transition-colors">
                            {accountContent}
                        </Link>
                    ) : (
                        <div className="min-w-0 truncate">
                            {accountContent}
                        </div>
                    )}
                </div>

                {(payerId || pagadorName || dueDateLabel) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 min-w-0">
                        {(payerId || pagadorName) && (
                            payerId ? (
                                <Link href={`/payers/${payerId}`} className="min-w-0 truncate hover:text-foreground transition-colors">
                                    {payerContent}
                                </Link>
                            ) : (
                                <div className="min-w-0 truncate">
                                    {payerContent}
                                </div>
                            )
                        )}
                        {(payerId || pagadorName) && dueDateLabel && <span className="shrink-0">•</span>}
                        {dueDateLabel && (
                            <span className="text-[12px] text-destructive font-medium shrink-0">
                                {dueDateLabel}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2.5">
                <MoneyValues
                    amount={item.amount}
                    showPositiveSign={isReceita || isIncomingTransfer}
                    className={cn(
                        "whitespace-nowrap text-sm font-medium block",
                        isReceita ? "text-success" : "text-foreground",
                        isTransfer && "text-info",
                    )}
                />
                
                {showActions && (
                    <div className="flex shrink-0 items-center gap-1">
                        <TransactionSettlementButton
                            item={item}
                            isLoading={isSettlementLoading(item.id)}
                            onToggle={onToggleSettlement}
                        />
                        <TransactionActionsMenu
                            item={item}
                            currentUserId={currentUserId}
                            onEdit={onEdit}
                            onCopy={onCopy}
                            onImport={onImport}
                            onConfirmDelete={onConfirmDelete}
                            onViewDetails={onViewDetails}
                            onRefund={onRefund}
                            onAnticipate={onAnticipate}
                            onViewAnticipationHistory={onViewAnticipationHistory}
                        />
                    </div>
                )}
            </div>
        </article>
    );
}