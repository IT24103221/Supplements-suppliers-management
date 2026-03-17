import React, { useState, useEffect } from 'react'
import Nav from '../Nav/Nav'
import axios from 'axios';
import './suppliersdetails.css';
import { Link } from 'react-router-dom';


const URL = "http://localhost:5000/suppliers";

const fetchHandler = async () => {
  return await axios.get(URL).then((res) => res.data);
}

function SuppliersDetails() { 
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetchHandler().then((data) => {
      setSuppliers(data.suppliers);
    });
  }, []);

  

  return (
    <div>
      <Nav />
      <div className="suppliers-container">
        <h1>Suppliers Details</h1>
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Company</th>
              <th>Suppliment Brand</th>
            
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers && suppliers.map((supplier, index) => (
              <tr key={index}>
                <td>{supplier._id}</td>
                <td>{supplier.name}</td>
                <td>{supplier.email}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.address}</td>
                <td>{supplier.company}</td>
                <td>{supplier.supplimentBrand}</td>
      
                <td>
                  <Link to={`/updatesuppliers/${supplier._id}`}>
                    <button className="btn-update">Update</button>
                  </Link>
                  <button className="btn-delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SuppliersDetails