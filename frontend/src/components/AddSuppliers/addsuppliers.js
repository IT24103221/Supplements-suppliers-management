import React from 'react'
import Nav from '../Nav/Nav';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './addsuppliers.css';

function AddSuppliers() {  
  const history = useNavigate();
  const [input, setInput] = React.useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    supplimentBrand: ""
  });

  const handlechange = (e) => {
    setInput((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    sendRequest().then(() => history("/suppliersdetails"));
  };

  const sendRequest = async () => {
    await axios.post("http://localhost:5000/suppliers", {
      name: String(input.name),
      email: String(input.email),
      phone: String(input.phone), 
      address: String(input.address),
      company: String(input.company),
      supplimentBrand: String(input.supplimentBrand)
    }).then((res) => res.data);
  };

  return (
    <div>
      <Nav />
      <div className="add-suppliers-container">
        <h1>Add Supplier</h1>
        <form onSubmit={handleSubmit}>
          <label>Name:</label>
          <input type="text" name='name' onChange={handlechange} value={input.name} required />

          <label>Email:</label>
          <input type="email" name='email' value={input.email} onChange={handlechange} required />

          <label>Phone:</label>
          <input type="text" name='phone' value={input.phone} onChange={handlechange} required />

          <label>Address:</label>
          <input type="text" name='address' value={input.address} onChange={handlechange} required />

          <label>Company:</label>
          <input type="text" name='company' value={input.company} onChange={handlechange} required />

          <label>Suppliment Brand:</label>
          <input type="text" name='supplimentBrand' value={input.supplimentBrand} onChange={handlechange} required />

          <button type='submit'>Add Supplier</button>
        </form>
      </div>
    </div>
  )
}

export default AddSuppliers