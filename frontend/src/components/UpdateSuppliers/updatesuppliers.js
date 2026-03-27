import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Nav from '../Nav/Nav';
import toast from 'react-hot-toast';
import './updatesuppliers.css';

const SUPPLIERS_URL = "http://localhost:5000/suppliers";
const SUPPLIMENT_PRODUCTS = {
  Vitamins: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D", "Vitamin E", "Vitamin K"],
  Proteins: ["Whey Protein", "Casein Protein", "Soy Protein", "Pea Protein"],
  Minerals: ["Calcium", "Magnesium", "Zinc", "Iron", "Potassium"],
  Herbs: ["Ashwagandha", "Turmeric", "Ginger", "Ginseng"],
  Other: ["Fish Oil", "Probiotics", "Collagen", "Melatonin", "Creatine"],
};

function UpdateSuppliers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    supplimentCategory: "",
    supplimentProduct: "",
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios.get(`${SUPPLIERS_URL}/${id}`).then((res) => {
      setInput(res.data.supplier);
    });
  }, [id]);

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

    if (!input.supplimentCategory) {
      newErrors.supplimentCategory = "Please select a category.";
    }

    if (!input.supplimentProduct) {
      newErrors.supplimentProduct = "Please select a product.";
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

  const handleChange = (e) => {
    let value = e.target.value;

    // Allow only digits for phone field and limit to 10
    if (e.target.name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    // Allow only letters and spaces for name
    if (e.target.name === "name") {
      value = value.replace(/[^a-zA-Z\s]/g, "");
    }

    if (e.target.name === "supplimentCategory") {
      setInput((prev) => ({
        ...prev,
        supplimentCategory: value,
        supplimentProduct: "",
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        supplimentCategory: "",
        supplimentProduct: "",
      }));
      return;
    }

    setInput((prev) => ({
      ...prev,
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

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) window.URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const formData = new FormData();
    formData.append("name", String(input.name));
    formData.append("email", String(input.email));
    formData.append("phone", String(input.phone));
    formData.append("address", String(input.address));
    formData.append("supplimentCategory", String(input.supplimentCategory));
    formData.append("supplimentProduct", String(input.supplimentProduct));
    if (photoFile) formData.append("photo", photoFile);

    try {
      await axios.put(`${SUPPLIERS_URL}/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Supplier Updated Successfully!");
      navigate("/suppliersdetails");
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Failed to update supplier. Please try again."
      );
    }
  };

  return (
    <div>
      <Nav />
      <div className="update-suppliers-container">
        <h1>Update Supplier</h1>
        <form onSubmit={handleSubmit}>

          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={input.name}
            onChange={handleChange}
            placeholder="Enter supplier name"
          />
          {errors.name && <p className="error-msg">{errors.name}</p>}

          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={input.email}
            onChange={handleChange}
            placeholder="Enter email address"
          />
          {errors.email && <p className="error-msg">{errors.email}</p>}

          <label>Phone:</label>
          <input
            type="text"
            name="phone"
            value={input.phone}
            onChange={handleChange}
            maxLength={10}
            placeholder="Enter 10 digit phone number"
          />
          {errors.phone && <p className="error-msg">{errors.phone}</p>}

          <label>Address:</label>
          <input
            type="text"
            name="address"
            value={input.address}
            onChange={handleChange}
            placeholder="Enter address"
          />
          {errors.address && <p className="error-msg">{errors.address}</p>}

          <label>Suppliment Category:</label>
          <select
            name="supplimentCategory"
            value={input.supplimentCategory}
            onChange={handleChange}
            className="select-input"
          >
            <option value="">-- Select Category --</option>
            {Object.keys(SUPPLIMENT_PRODUCTS).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.supplimentCategory && <p className="error-msg">{errors.supplimentCategory}</p>}

          {input.supplimentCategory && (
            <>
              <label>Suppliment Product:</label>
              <select
                name="supplimentProduct"
                value={input.supplimentProduct}
                onChange={handleChange}
                className="select-input"
              >
                <option value="">-- Select Product --</option>
                {SUPPLIMENT_PRODUCTS[input.supplimentCategory]?.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
              {errors.supplimentProduct && <p className="error-msg">{errors.supplimentProduct}</p>}
            </>
          )}

          <label>Photo (optional):</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          {errors.photo && <p className="error-msg">{errors.photo}</p>}

          <div className="update-suppliers-photoRow">
            <div className="update-suppliers-photoCol">
              <div className="update-suppliers-photoLabel">Current photo</div>
              <div className="update-suppliers-avatar">
                {input.photoUrl ? (
                  <img src={input.photoUrl} alt="Current supplier" />
                ) : (
                  <span>
                    {(input?.name?.trim?.()?.[0] || "?").toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="update-suppliers-photoCol">
              <div className="update-suppliers-photoLabel">New photo preview</div>
              <div className="update-suppliers-avatar">
                {photoPreviewUrl ? (
                  <img src={photoPreviewUrl} alt="New supplier preview" />
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>
          </div>

          <button type="submit">Update Supplier</button>
        </form>
      </div>
    </div>
  )
}

export default UpdateSuppliers;