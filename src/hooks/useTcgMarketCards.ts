import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  buildCardQuery,
  fetchCardsPage,
  fetchTopValuedCards,
} from '../components/pokemonTCG/tcgApi';
import { TCG_MARKET_PAGE_SIZE } from '../components/pokemonTCG/tcgTypes';
import type { TcgCard } from '../components/pokemonTCG/tcgTypes';
import { isAbortError } from '../utils/retryUtils';

interface UseTcgMarketCardsOptions {
  debouncedQuery: string;
  selectedSet: string;
  selectedType: string;
  currentPage: number;
  showingExpensive: boolean;
}

export function useTcgMarketCards({
  debouncedQuery,
  selectedSet,
  selectedType,
  currentPage,
  showingExpensive,
}: UseTcgMarketCardsOptions) {
  const [cards, setCards] = useState<TcgCard[]>([]);
  const [expensiveCards, setExpensiveCards] = useState<TcgCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [totalPages, setTotalPages] = useState(1);

  const query = useMemo(
    () =>
      buildCardQuery({
        nameQuery: debouncedQuery,
        setId: selectedSet,
        type: selectedType,
      }),
    [debouncedQuery, selectedSet, selectedType],
  );

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (showingExpensive) {
          const sorted = await fetchTopValuedCards(query, controller.signal);
          if (controller.signal.aborted) return;

          setExpensiveCards(sorted);
          setTotalPages(Math.max(1, Math.ceil(sorted.length / TCG_MARKET_PAGE_SIZE)));
        } else {
          setExpensiveCards([]);
          const { data, totalCount } = await fetchCardsPage(
            query,
            currentPage,
            TCG_MARKET_PAGE_SIZE,
            undefined,
            controller.signal,
          );
          if (controller.signal.aborted) return;

          setCards(data);
          setTotalPages(Math.max(1, Math.ceil((totalCount ?? 0) / TCG_MARKET_PAGE_SIZE)));
        }
      } catch (err) {
        if (isAbortError(err)) return;
        if (!controller.signal.aborted) {
          setError(isAxiosError(err) ? err : err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => controller.abort();
  }, [query, currentPage, showingExpensive]);

  const displayedCards = useMemo(() => {
    if (showingExpensive) {
      const start = (currentPage - 1) * TCG_MARKET_PAGE_SIZE;
      return expensiveCards.slice(start, start + TCG_MARKET_PAGE_SIZE);
    }
    return cards;
  }, [cards, expensiveCards, showingExpensive, currentPage]);

  return { displayedCards, isLoading, error, totalPages };
}
