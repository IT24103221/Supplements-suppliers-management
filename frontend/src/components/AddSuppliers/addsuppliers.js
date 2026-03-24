import React from 'react'
import Nav from '../Nav/Nav';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './addsuppliers.css';

// ✅ Suppliment Products List
const SUPPLIMENT_PRODUCTS = {
  "Vitamins": ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D", "Vitamin E", "Vitamin K"],
  "Proteins": ["Whey Protein", "Casein Protein", "Soy Protein", "Pea Protein"],
  "Minerals": ["Calcium", "Magnesium", "Zinc", "Iron", "Potassium"],
  "Herbs": ["Ashwagandha", "Turmeric", "Ginger", "Ginseng"],
  "Other": ["Fish Oil", "Probiotics", "Collagen", "Melatonin", "Creatine"]
};

function AddSuppliers() {  
  const history = useNavigate();
  const [input, setInput] = React.useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    supplimentCategory: "",
    supplimentProduct: ""
  });

  const [photoFile, setPhotoFile] = React.useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = React.useState("");
  const [errors, setErrors] = React.useState({});

  const validate = () => {
    let newErrors = {};

    if (!input.name.trim()) {
      newErrors.name = "Name is required.";
    } else if (!/^[a-zA-Z\s]+$/.test(input.name)) {
      newErrors.name = "Name can only contain letters.";
    }

    if (!input.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!input.phone.trim()) {
      newErrors.phone = "Phone is required.";
    } else if (input.phone.length < 10) {
      newErrors.phone = "Phone number must be at least 10 digits.";
    } else if (input.phone.length > 10) {
      newErrors.phone = "Phone number cannot exceed 10 digits.";
    }

    if (!input.address.trim()) {
      newErrors.address = "Address is required.";
    }

    // ✅ Category & Product validation
    if (!input.supplimentCategory) {
      newErrors.supplimentCategory = "Please select a category.";
    }

    if (!input.supplimentProduct) {
      newErrors.supplimentProduct = "Please select a product.";
    }

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

    if (e.target.name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    if (e.target.name === "name") {
      value = value.replace(/[^a-zA-Z\s]/g, "");
    }

    // ✅ Category change වෙලාම product reset කරනවා
    if (e.target.name === "supplimentCategory") {
      setInput((prevState) => ({
        ...prevState,
        supplimentCategory: value,
        supplimentProduct: ""
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        supplimentCategory: "",
        supplimentProduct: ""
      }));
      return;
    }

    setInput((prevState) => ({
      ...prevState,
      [e.target.name]: value
    }));

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
    formData.append("supplimentCategory", String(input.supplimentCategory));
    formData.append("supplimentProduct", String(input.supplimentProduct));
    if (photoFile) formData.append("photo", photoFile);

    await axios
      .post("http://localhost:5000/suppliers/admin", formData, {
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
          <input type="text" name='name' onChange={handlechange} value={input.name} placeholder="Enter supplier name" />
          {errors.name && <p className="error-msg">{errors.name}</p>}

          <label>Email:</label>
          <input type="email" name='email' value={input.email} onChange={handlechange} placeholder="Enter email address" />
          {errors.email && <p className="error-msg">{errors.email}</p>}

          <label>Phone:</label>
          <input type="text" name='phone' value={input.phone} onChange={handlechange} maxLength={10} placeholder="Enter 10 digit phone number" />
          {errors.phone && <p className="error-msg">{errors.phone}</p>}

          <label>Address:</label>
          <input type="text" name='address' value={input.address} onChange={handlechange} placeholder="Enter address" />
          {errors.address && <p className="error-msg">{errors.address}</p>}

          {/* Category Dropdown */}
          <label>Suppliment Category:</label>
          <select name="supplimentCategory" value={input.supplimentCategory} onChange={handlechange} className="select-input">
            <option value="">-- Select Category --</option>
            {Object.keys(SUPPLIMENT_PRODUCTS).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.supplimentCategory && <p className="error-msg">{errors.supplimentCategory}</p>}

          {/*Product Dropdown - Category selected */}
          {input.supplimentCategory && (
            <>
              <label>Suppliment Product:</label>
              <select name="supplimentProduct" value={input.supplimentProduct} onChange={handlechange} className="select-input">
                <option value="">-- Select Product --</option>
                {SUPPLIMENT_PRODUCTS[input.supplimentCategory].map((product) => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
              {errors.supplimentProduct && <p className="error-msg">{errors.supplimentProduct}</p>}
            </>
          )}

          <label>Photo (optional):</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
          {errors.photo && <p className="error-msg">{errors.photo}</p>}
          {photoPreviewUrl && (
            <div className="photo-preview-wrapper">
              <img
                src={photoPreviewUrl}
                alt="Selected supplier"
                className="photo-preview-image"
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