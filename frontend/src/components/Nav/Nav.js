import React from "react";
import './Nav.css';
import { Link } from "react-router-dom";

function Nav() {
  return (
    <div>
      <ul className="home-ul">
        <li className="home-1l">
          <Link to="/mainhome" className="nav-link">
            <h1>home</h1>
          </Link>
        </li>
        <li className="home-1l">
            <Link to="/addsuppliers" className="nav-link">
          <h1>ADD suppliers</h1>
          </Link>
        </li>
        <li className="home-1l">
             <Link to="/suppliersdetails" className="nav-link">
          <h1>suppliers details</h1>
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Nav;