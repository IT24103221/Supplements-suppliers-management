import React from 'react'
import Nav from '../Nav/Nav';
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div>
      <Nav />
      <div className="home-container">
        <h1 className="home-title">Welcome</h1>
        <p className="home-subtitle">
          Supplement submissions will be reviewed by an admin.
        </p>

        <div className="home-actions">
          <Link to="/supplier-register" className="home-btn home-btn--primary">
            Supplier Registration
          </Link>
          <Link to="/addsupplements" className="home-btn home-btn--primary">
            Add Supplements
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home