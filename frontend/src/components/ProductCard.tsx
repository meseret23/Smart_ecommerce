import React from 'react';
import type { Product } from '../services/productService';

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  console.log("Product data:", product.name, "image_url:", product.image_url);
  const imageUrl = product.image_url || (product as any).imageUrl;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-200 border border-gray-100 overflow-hidden flex flex-col justify-between">
      <div className="p-5">
        <div className="h-40 w-full rounded-lg mb-4 overflow-hidden bg-gray-100 flex items-center justify-center">
          {imageUrl && imageUrl.trim() !== '' ? (
            <img 
              src={imageUrl} 
              alt={product.name} 
              className="h-full w-full object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-gray-400 font-medium text-sm">📦 Image Placeholder</span>
          )}
        </div>
        <span className="text-xs font-semibold uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
          {product.category || 'General'}
        </span>
        <h4 className="font-bold text-gray-900 text-lg mt-2 line-clamp-1">{product.name}</h4>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
      </div>

      <div className="p-5 pt-0 flex items-center justify-between mt-auto">
        <div>
          <span className="text-xs text-gray-400 block">Price</span>
          <span className="text-lg font-bold text-gray-900">{product.price} ETB</span>
        </div>
        <button 
          onClick={onAddToCart}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};