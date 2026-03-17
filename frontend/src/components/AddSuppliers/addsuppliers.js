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

  const [photoFile, setPhotoFile] = React.useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = React.useState("");
  const [errors, setErrors] = React.useState({});

  const validate = () => {
    let newErrors = {};

    // Name validation
    if (!input.name.trim()) {
      newErrors.name = "Name is required.";
    } else if (!/^[a-zA-Z\s]+$/.test(input.name)) {
      newErrors.name = "Name can only contain letters.";
    }

    // Email validation
    if (!input.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    // Phone validation
    if (!input.phone.trim()) {
      newErrors.phone = "Phone is required.";
    } else if (input.phone.length < 10) {
      newErrors.phone = "Phone number must be at least 10 digits.";
    } else if (input.phone.length > 10) {
      newErrors.phone = "Phone number cannot exceed 10 digits.";
    }

    // Address validation
    if (!input.address.trim()) {
      newErrors.address = "Address is required.";
    }

    // Company validation
    if (!input.company.trim()) {
      newErrors.company = "Company is required.";
    } else if (!/^[a-zA-Z\s]+$/.test(input.company)) {
      newErrors.company = "Company can only contain letters.";
    }

    // Suppliment Brand validation
    if (!input.supplimentBrand.trim()) {
      newErrors.supplimentBrand = "Suppliment Brand is required.";
    }

    // Photo validation (optional, but if selected must be an image)
    if (photoFile) {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(photoFile.type)) {
        newErrors.photo = "Only JPG, PNG, or WEBP images are allowed.";
      } else if (photoFile.size > 5 * 1024 * 1024) {
        newErrors.photo = "Photo must be 5MB or smaller.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlechange = (e) => {
    let value = e.target.value;

    // Allow only digits for phone field and limit to 10
    if (e.target.name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    // Allow only letters and spaces for name and company
    if (e.target.name === "name" || e.target.name === "company") {
      value = value.replace(/[^a-zA-Z\s]/g, "");
    }

    setInput((prevState) => ({
      ...prevState,
      [e.target.name]: value
    }));

    // Clear error on change
    setErrors((prevErrors) => ({
      ...prevErrors,
      [e.target.name]: ""
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setPhotoFile(null);
      setPhotoPreviewUrl("");
      return;
    }

    setPhotoFile(file);
    const url = window.URL.createObjectURL(file);
    setPhotoPreviewUrl(url);

    setErrors((prev) => ({ ...prev, photo: "" }));
  };

  React.useEffect(() => {
    return () => {
      if (photoPreviewUrl) window.URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    sendRequest().then(() => history("/suppliersdetails"));
  };

  const sendRequest = async () => {
    const formData = new FormData();
    formData.append("name", String(input.name));
    formData.append("email", String(input.email));
    formData.append("phone", String(input.phone));
    formData.append("address", String(input.address));
    formData.append("company", String(input.company));
    formData.append("supplimentBrand", String(input.supplimentBrand));
    if (photoFile) formData.append("photo", photoFile);

    await axios
      .post("http://localhost:5000/suppliers", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  };

  return (
    <div>
      <Nav />
      <div className="add-suppliers-container">
        <h1>Add Supplier</h1>
        <form onSubmit={handleSubmit}>

          <label>Name:</label>
          <input 
            type="text" 
            name='name' 
            onChange={handlechange} 
            value={input.name}
            placeholder="Enter supplier name"
          />
          {errors.name && <p className="error-msg">{errors.name}</p>}

          <label>Email:</label>
          <input 
            type="email" 
            name='email' 
            value={input.email} 
            onChange={handlechange}
            placeholder="Enter email address"
          />
          {errors.email && <p className="error-msg">{errors.email}</p>}

          <label>Phone:</label>
          <input 
            type="text" 
            name='phone' 
            value={input.phone} 
            onChange={handlechange}
            maxLength={10}
            placeholder="Enter 10 digit phone number"
          />
          {errors.phone && <p className="error-msg">{errors.phone}</p>}

          <label>Address:</label>
          <input 
            type="text" 
            name='address' 
            value={input.address} 
            onChange={handlechange}
            placeholder="Enter address"
          />
          {errors.address && <p className="error-msg">{errors.address}</p>}

          <label>Company:</label>
          <input 
            type="text" 
            name='company' 
            value={input.company} 
            onChange={handlechange}
            placeholder="Enter company name"
          />
          {errors.company && <p className="error-msg">{errors.company}</p>}

          <label>Suppliment Brand:</label>
          <input 
            type="text" 
            name='supplimentBrand' 
            value={input.supplimentBrand} 
            onChange={handlechange}
            placeholder="Enter suppliment brand"
          />
          {errors.supplimentBrand && <p className="error-msg">{errors.supplimentBrand}</p>}

          <label>Photo (optional):</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          {errors.photo && <p className="error-msg">{errors.photo}</p>}
          {photoPreviewUrl && (
            <div style={{ marginTop: "6px" }}>
              <img
                src={photoPreviewUrl}
                alt="Selected supplier"
                style={{
                  width: "100%",
                  maxHeight: "220px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  border: "1px solid rgba(2, 6, 23, 0.12)",
                }}
              />
            </div>
          )}

          <button type='submit'>Add Supplier</button>
        </form>
      </div>
    </div>
  )
}

export default AddSuppliers