import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  buildCardQuery,
  fetchAllMatchingCards,
  fetchCardsPage,
} from '../components/pokemonTCG/tcgApi';
import { getMarketPrice } from '../components/pokemonTCG/tcgPriceUtils';
import { TCG_MARKET_PAGE_SIZE } from '../components/pokemonTCG/tcgTypes';
import type { TcgCard } from '../components/pokemonTCG/tcgTypes';

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
    let cancelled = false;

    const loadCurrentPage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, totalCount } = await fetchCardsPage(
          query,
          currentPage,
          TCG_MARKET_PAGE_SIZE,
        );
        if (cancelled) return;

        setCards(data);
        setTotalPages(Math.max(1, Math.ceil((totalCount ?? 0) / TCG_MARKET_PAGE_SIZE)));
      } catch (err) {
        if (!cancelled) setError(isAxiosError(err) ? err : err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const loadAllAndSort = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const all = await fetchAllMatchingCards(query);
        if (cancelled) return;

        const sorted = all
          .filter((card) => getMarketPrice(card) != null)
          .sort((a, b) => (getMarketPrice(b) ?? 0) - (getMarketPrice(a) ?? 0));

        setExpensiveCards(sorted);
        setTotalPages(Math.max(1, Math.ceil(sorted.length / TCG_MARKET_PAGE_SIZE)));
      } catch (err) {
        if (!cancelled) setError(isAxiosError(err) ? err : err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    if (showingExpensive) {
      loadAllAndSort();
    } else {
      setExpensiveCards([]);
      loadCurrentPage();
    }

    return () => {
      cancelled = true;
    };
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
