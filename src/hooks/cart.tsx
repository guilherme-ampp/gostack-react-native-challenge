import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartProducts = await AsyncStorage.getItem('@gomarketplace-cart');
      if (cartProducts) {
        setProducts(JSON.parse(cartProducts));
      }
    }
    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(product => {
        if (product.id === id) {
          return {
            id: product.id,
            title: product.title,
            image_url: product.image_url,
            price: product.price,
            quantity: product.quantity + 1,
          };
        }
        return product;
      });
      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@gomarketplace-cart',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProducts = products.map(product => {
        if (product.id === id && product.quantity > 0) {
          return {
            id,
            title: product.title,
            image_url: product.image_url,
            price: product.price,
            quantity: product.quantity - 1,
          };
        }
        return product;
      });

      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@gomarketplace-cart',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async ({ id, title, image_url, price }) => {
      const existingProduct = products.find(item => item.id === id);

      if (existingProduct) {
        await increment(id);
      } else {
        const updatedProducts = [
          ...products,
          { id, title, image_url, price, quantity: 1 },
        ];
        setProducts(updatedProducts);
        await AsyncStorage.setItem(
          '@gomarketplace-cart',
          JSON.stringify(updatedProducts),
        );
      }
    },
    [products, increment],
  );

  const value = React.useMemo<CartContext>(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
    }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
