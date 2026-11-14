
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Headphones } from 'lucide-react';

import { fetchProducts } from '../services/productService';
import type { Product } from '../services/productService';
import { ProductCard } from '../components/ProductCard';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        const data = await fetchProducts();

        if (active) {
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to load homepage products:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const categories = Array.from(
    new Set(
      products
        .map((product) => product.category)
        .filter((category): category is string => Boolean(category))
    )
  ).slice(0, 4);

  const featuredProducts = products.slice(0, 4);

  return (
    <div className="home-page">
     

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-eyebrow">WELCOME TO SMARTMARKET</span>

          <h1>
            Everything you need.
            <br />
            All in one place.
          </h1>

          <p>
            Discover quality products, explore your favorites,
            and enjoy a simpler shopping experience.
          </p>

          <Link to="/products" className="home-cta">
            Explore Products <ArrowRight size={18} />
          </Link>

          <div className="hero-note">
            Quality products. Convenient shopping.
          </div>
        </div>

        <div className="home-hero-image">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1100&q=85"
            alt="Modern shopping store"
          />
        </div>
      </section>
      

      {/* Categories */}
      <section className="home-section">
        <div className="section-heading">
          <div>
            <span className="home-eyebrow">FIND YOUR FAVORITES</span>
            <h2>Shop by Category</h2>
            <p>Explore products by category.</p>
          </div>

          <Link to="/products" className="section-link">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <p className="home-status">Loading categories...</p>
        ) : categories.length > 0 ? (
          <div className="category-grid">
            {categories.map((category) => (
              <Link
                key={category}
                to={`/products?category=${encodeURIComponent(category)}`}
                className="category-card"
              >
                <span className="category-icon">✦</span>
                <h3>{category}</h3>
                <span>Explore category →</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="home-status">
            Browse our complete product collection.
          </p>
        )}
      </section>

      {/* Featured Products */}
      <section className="home-section featured-section">
        <div className="section-heading">
          <div>
            <span className="home-eyebrow">OUR COLLECTION</span>
            <h2>Featured Products</h2>
            <p>Discover products available at SmartMarket.</p>
          </div>

          <Link to="/products" className="section-link">
            View all products <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <p className="home-status">Loading products...</p>
        ) : featuredProducts.length > 0 ? (
          <div className="featured-grid">
            {featuredProducts.map((product) => (
              <Link
                to={`/products/${product.id}`}
                key={product.id}
                className="featured-product-link"
              >
                <ProductCard product={product} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="home-status">
            No products are available right now.
          </p>
        )}
      </section>

      {/* Benefits */}
      <section className="benefits-section">
        <div className="benefit-item">
          <Truck size={27} />
          <div>
            <h3>Convenient Shopping</h3>
            <p>Explore products in one place.</p>
          </div>
        </div>

        <div className="benefit-item">
          <ShieldCheck size={27} />
          <div>
            <h3>Secure Payments</h3>
            <p>Checkout with Chapa payment.</p>
          </div>
        </div>

        <div className="benefit-item">
          <Headphones size={27} />
          <div>
            <h3>Customer Support</h3>
            <p>We're here to help with your orders.</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="home-bottom-cta">
        <h2>Ready to discover something new?</h2>
        <p>Explore the SmartMarket collection today.</p>
        <Link to="/products" className="home-cta">
          Start Shopping <ArrowRight size={18} />
        </Link>
      </section>

    </div>
  );
};

export default HomePage;
