export interface Product {
  id: string | number;
  title?: string;
  name?: string;
  price: number | string;
  category?: string;
  description?: string;
  image_url?: string;
  image?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  recommendedProducts?: Product[];
}

export const processUserQuery = async (
  query: string,
  catalog: Product[]
): Promise<{ text: string; products: Product[] }> => {
  const lowerQuery = query.trim().toLowerCase();

  // 1. Handle Greetings
  if (['hello', 'hi', 'hey', 'salam', 'selam', 'good morning', 'good afternoon'].includes(lowerQuery)) {
    return {
      text: "Selam! How can I help you today? You can ask me for product recommendations, specific categories, or items within your budget!",
      products: [],
    };
  }

  // 2. Handle Price / Budget Limits
  const priceMatch = lowerQuery.match(/(?:under|below|less than|max|budget of)\s*(\d+)/i) || lowerQuery.match(/(\d+)\s*(?:etb|birr)/i);
  
  if (priceMatch && priceMatch[1]) {
    const maxBudget = parseFloat(priceMatch[1]);
    const budgetProducts = catalog.filter((p) => Number(p.price) <= maxBudget);

    if (budgetProducts.length > 0) {
      return {
        text: `Here are the items available under ${maxBudget} ETB:`,
        products: budgetProducts.slice(0, 3),
      };
    } else {
      const cheapest = [...catalog].sort((a, b) => Number(a.price) - Number(b.price));
      return {
        text: `We don't have items under ${maxBudget} ETB right now. Here are our most affordable options:`,
        products: cheapest.slice(0, 2),
      };
    }
  }

  // 3. Handle Deals & Cheap items
  if (lowerQuery.includes('cheap') || lowerQuery.includes('budget') || lowerQuery.includes('best deals') || lowerQuery.includes('deal')) {
    const sorted = [...catalog].sort((a, b) => Number(a.price) - Number(b.price));
    return {
      text: "Here are the top budget-friendly deals currently available on SmartMarket:",
      products: sorted.slice(0, 3),
    };
  }

  // 4. Intent detection for Home & Kitchen / Fashion / Electronics
  const isHomeOrKitchen = /(kitchen|home|cook|appliance|dish|pan)/i.test(lowerQuery);
  const isFashion = /(fashion|clothes|wear|shirt|shoe|jacket|dress)/i.test(lowerQuery);

  if (isHomeOrKitchen) {
    const kitchenItems = catalog.filter((p) => {
      const cat = ((p as any).category || '').toLowerCase();
      const title = ((p as any).title || (p as any).name || '').toLowerCase();
      return cat.includes('home') || cat.includes('kitchen') || title.includes('home') || title.includes('kitchen');
    });

    if (kitchenItems.length > 0) {
      return {
        text: `Here are our available Home & Kitchen items:`,
        products: kitchenItems,
      };
    } else {
      return {
        text: `We currently don't have active Home & Kitchen items in stock. Check out our featured electronics and tech gear instead:`,
        products: catalog.slice(0, 2),
      };
    }
  }

  if (isFashion) {
    const fashionItems = catalog.filter((p) => {
      const cat = ((p as any).category || '').toLowerCase();
      return cat.includes('fashion');
    });

    if (fashionItems.length > 0) {
      return {
        text: `Here are our available fashion items:`,
        products: fashionItems,
      };
    } else {
      return {
        text: `We currently don't have active fashion items in stock. Here are some popular tech items you might like:`,
        products: catalog.slice(0, 2),
      };
    }
  }

  // 5. General Keyword Search
  const matchingProducts = catalog.filter((product) => {
    const item = product as any;
    const title = (item.title || item.name || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    const description = (item.description || '').toLowerCase();

    return (
      title.includes(lowerQuery) ||
      category.includes(lowerQuery) ||
      description.includes(lowerQuery)
    );
  });

  if (matchingProducts.length > 0) {
    return {
      text: `Here are items matching "${query}":`,
      products: matchingProducts.slice(0, 3),
    };
  }

  return {
    text: `I couldn't find an exact match for "${query}", but here are our top featured items:`,
    products: catalog.slice(0, 2),
  };
};