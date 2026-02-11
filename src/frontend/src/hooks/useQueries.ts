import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { RateCard, RateCardItem, QuoteHeader, FullQuote, QuoteHistoryItem, AccountManagerList, AccountManager, AnalysisSummary } from '../backend';

export function useGetRateCard() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<RateCard>({
    queryKey: ['rateCard'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getRateCard();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUpdateRateCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: RateCardItem[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateRateCard(items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rateCard'] });
    },
  });
}

export function useGenerateFullQuote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ header, selectedItems }: { header: QuoteHeader; selectedItems: [string, bigint, bigint][] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateFullQuote(header, selectedItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quoteHistory'] });
    },
  });
}

export function useGenerateAnalysis() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (selectedItems: [string, bigint, bigint][]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateAnalysis(selectedItems);
    },
  });
}

export function useGetQuoteHistory() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<QuoteHistoryItem[]>({
    queryKey: ['quoteHistory'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getQuoteHistory();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetQuoteHistoryItem() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getQuoteHistoryItem(id);
    },
  });
}

export function useUpdateStandardCost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, newStandardCost }: { itemId: string; newStandardCost: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStandardCost(itemId, newStandardCost);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rateCard'] });
    },
  });
}

export function useGetAccountManagers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AccountManagerList>({
    queryKey: ['accountManagers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAccountManagers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUpdateAccountManagers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (managers: AccountManager[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAccountManagers(managers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountManagers'] });
    },
  });
}

export function useAddAccountManager() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (manager: AccountManager) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAccountManager(manager);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountManagers'] });
    },
  });
}

export function useDeleteAccountManager() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAccountManager(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountManagers'] });
    },
  });
}

export function useAddRateCardItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: RateCardItem) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addRateCardItem(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rateCard'] });
    },
  });
}

export function useDeleteRateCardItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteRateCardItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rateCard'] });
    },
  });
}

export function useUpdateRateCardItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: RateCardItem) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateRateCardItem(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rateCard'] });
    },
  });
}
