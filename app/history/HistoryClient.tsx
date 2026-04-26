"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TransactionList from "@/components/history/TransactionList";
import { type Transaction, type TransactionType } from "@/components/history/TransactionCard";
import { useStellar } from "@/context/StellarContext";
import {
  createHorizonClient,
  createTransactionHistoryPager,
  fetchTransactionHistory,
  type ParsedOperation,
  type ParsedTransaction,
  type TransactionHistoryPager,
} from "@/lib/stellar/history";
import useTransactionPolling from "@/hooks/useTransactionPolling";

function formatOperationAmount(operation?: ParsedOperation): string {
  if (!operation?.amount) return "--";

  const numericAmount = Number(operation.amount);
  if (!Number.isFinite(numericAmount)) {
    return `${operation.amount} ${operation.asset ?? "XLM"}`;
  }

  return `${numericAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  })} ${operation.asset ?? "XLM"}`;
}

function inferTransactionType(operations: ParsedOperation[]): TransactionType {
  const hasRelease = operations.some((op) => op.type === "invoke_host_function" && /release/i.test(op.function ?? ""));
  if (hasRelease) return "release";

  const hasRefund = operations.some((op) => op.type === "invoke_host_function" && /refund/i.test(op.function ?? ""));
  if (hasRefund) return "refund";

  return "contribute";
}

function mapParsedTransaction(tx: ParsedTransaction): Transaction {
  const contractId = tx.operations.find(op => op.contractId)?.contractId;
  
  return {
    id: tx.id || tx.hash,
    type: inferTransactionType(tx.operations),
    amount: formatOperationAmount(tx.operations[0]),
    status: tx.successful ? "success" : "failed",
    timestamp: tx.timestamp,
    txHash: tx.hash,
    contractId,
  };
}

export default function HistoryClient() {
  const { publicKey, isConnected } = useStellar();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPollingError, setIsPollingError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newHashes, setNewHashes] = useState<string[]>([]);

  const pagerRef = useRef<TransactionHistoryPager | null>(null);
  const fadeTimersRef = useRef<Record<string, number>>({});

  const horizonClient = useMemo(() => createHorizonClient(), []);

  useEffect(() => {
    return () => {
      Object.values(fadeTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      fadeTimersRef.current = {};
    };
  }, []);

  const markAsNew = useCallback((items: Transaction[]) => {
    const hashes = items.map((tx) => tx.txHash);
    if (hashes.length === 0) return;

    setNewHashes((prev) => Array.from(new Set([...hashes, ...prev])));

    hashes.forEach((hash) => {
      if (fadeTimersRef.current[hash] !== undefined) {
        window.clearTimeout(fadeTimersRef.current[hash]);
      }
      fadeTimersRef.current[hash] = window.setTimeout(() => {
        setNewHashes((prev) => prev.filter((txHash) => txHash !== hash));
        delete fadeTimersRef.current[hash];
      }, 5000);
    });
  }, []);

  const fetchLatestPage = useCallback(async () => {
    if (!publicKey) return [];

    const result = await fetchTransactionHistory({
      client: horizonClient,
      accountId: publicKey,
      limit: 10,
      order: "desc",
      includeOperations: true,
    });

    return result.transactions.map(mapParsedTransaction);
  }, [horizonClient, publicKey]);

  const loadInitial = useCallback(async () => {
    if (!publicKey) {
      setTransactions([]);
      setHasMore(false);
      setIsLoadingInitial(false);
      return;
    }

    setIsLoadingInitial(true);

    const pager = createTransactionHistoryPager({
      client: horizonClient,
      accountId: publicKey,
      limit: 10,
      order: "desc",
      includeOperations: true,
    });

    pagerRef.current = pager;

    const firstPage = await pager.fetchNext();
    const mapped = firstPage.transactions.map(mapParsedTransaction);

    setTransactions(mapped);
    setHasMore(Boolean(firstPage.nextCursor) && mapped.length === 10);
    setIsLoadingInitial(false);
  }, [horizonClient, publicKey]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const handleLoadMore = useCallback(async () => {
    const pager = pagerRef.current;
    if (!pager || !hasMore || !publicKey) return;

    setIsLoadingMore(true);
    try {
      const nextPage = await pager.fetchNext();
      const mapped = nextPage.transactions.map(mapParsedTransaction);

      setTransactions((prev) => [...prev, ...mapped]);
      setHasMore(Boolean(nextPage.nextCursor) && mapped.length === 10);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, publicKey]);

  useTransactionPolling<Transaction>({
    enabled: isConnected && Boolean(publicKey),
    currentTransactions: transactions,
    fetchLatest: fetchLatestPage,
    onNewTransactions: (newTransactions) => {
      setTransactions((prev) => [...newTransactions, ...prev]);
      markAsNew(newTransactions);
      setIsPollingError(false);
    },
    intervalMs: 15_000,
  });

  // Keep polling resilient; errors do not block the page.
  useEffect(() => {
    const listener = (event: PromiseRejectionEvent) => {
      if (String(event.reason ?? "").toLowerCase().includes("history")) {
        setIsPollingError(true);
      }
    };

    window.addEventListener("unhandledrejection", listener);
    return () => window.removeEventListener("unhandledrejection", listener);
  }, []);

  if (!publicKey) {
    return (
      <div className="glass-card border border-white/10 p-8 text-center">
        <p className="text-dark-300 text-sm font-medium">Connect your wallet to load on-chain transaction history.</p>
      </div>
    );
  }

  if (isLoadingInitial) {
    return <div className="text-dark-400 text-sm">Loading transactions...</div>;
  }

  return (
    <div className="space-y-4">
      {isPollingError && (
        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          Real-time updates temporarily unavailable. Retrying automatically.
        </p>
      )}
      <TransactionList
        transactions={transactions}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
        newBadgeHashes={newHashes}
      />
    </div>
  );
}
