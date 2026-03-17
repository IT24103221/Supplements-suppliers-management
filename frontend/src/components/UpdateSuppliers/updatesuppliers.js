import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Nav from '../Nav/Nav';
import './updatesuppliers.css';

const URL = "http://localhost:5000/suppliers";

function UpdateSuppliers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    supplimentBrand: ""
  });

  useEffect(() => {
    axios.get(`${URL}/${id}`).then((res) => {
      setInput(res.data.supplier);
    });
  }, [id]);

  const handleChange = (e) => {
    setInput((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.put(`${URL}/${id}`, input)
      .then(() => {
        alert("Supplier Updated Successfully!");
        navigate("/suppliersdetails");
      });
  };

  return (
    <div>
      <Nav />
      <div className="update-suppliers-container">
        <h1>Update Supplier</h1>
        <form onSubmit={handleSubmit}>
          <label>Name:</label>
          <input type="text" name="name" value={input.name} onChange={handleChange} required />

          <label>Email:</label>
          <input type="email" name="email" value={input.email} onChange={handleChange} required />

          <label>Phone:</label>
          <input type="text" name="phone" value={input.phone} onChange={handleChange} required />

          <label>Address:</label>
          <input type="text" name="address" value={input.address} onChange={handleChange} required />

          <label>Company:</label>
          <input type="text" name="company" value={input.company} onChange={handleChange} required />

          <label>Suppliment Brand:</label>
          <input type="text" name="supplimentBrand" value={input.supplimentBrand} onChange={handleChange} required />

          <button type="submit">Update Supplier</button>
        </form>
      </div>
    </div>
  )
}

export default UpdateSuppliers;