import React from 'react'
import Nav from '../Nav/Nav';
import { Link } from "react-router-dom";
import { ShoppingBag, Zap, Shield, Heart } from "lucide-react";
import "./Home.css";

function Home() {
  return (
    <div className="home-page-wrapper">
      <Nav />
      
      {/* --- Hero Section --- */}
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Premium Fuel for Your <span className="text-accent">Ultimate Goals</span>
          </h1>
          <p className="hero-subtitle">
            Discover a curated selection of world-class supplements designed to push your performance to the next level. Quality guaranteed.
          </p>
          <div className="hero-actions">
            <Link to="/supplementsdetails" className="btn-gms btn-gms-primary hero-btn">
              <ShoppingBag size={20} />
              Shop Now
            </Link>
          </div>
        </div>
        <div className="hero-image-container">
          {/* You can add a hero image here if available */}
          <div className="hero-glow-effect"></div>
        </div>
      </header>

      {/* --- Categories / Features Section --- */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Shop by Category</h2>
          <div className="title-underline"></div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper proteins">
              <Zap size={32} />
            </div>
            <h3>Proteins</h3>
            <p>Build and repair muscle with our range of high-quality whey, isolate, and plant proteins.</p>
            <Link to="/supplementsdetails" className="feature-link">Browse Proteins →</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper creatine">
              <Shield size={32} />
            </div>
            <h3>Creatine</h3>
            <p>Enhance your strength and power output with pure, pharmaceutical-grade creatine monohydrate.</p>
            <Link to="/supplementsdetails" className="feature-link">Browse Creatine →</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper vitamins">
              <Heart size={32} />
            </div>
            <h3>Vitamins</h3>
            <p>Support your recovery and overall well-being with essential multivitamins and minerals.</p>
            <Link to="/supplementsdetails" className="feature-link">Browse Vitamins →</Link>
          </div>
        </div>
      </section>

      {/* --- Simple Footer --- */}
      <footer className="home-footer">
        <p>&copy; 2026 Gym Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;