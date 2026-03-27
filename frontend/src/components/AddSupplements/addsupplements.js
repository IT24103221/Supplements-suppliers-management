import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Nav from "../Nav/Nav";
import "../AddSuppliers/addsuppliers.css";

const CATEGORIES = ["Proteins", "Vitamins", "Creatine", "Minerals", "Herbs", "Other"];

function AddSupplements() {
  const navigate = useNavigate();

  const [input, setInput] = React.useState({
    supplementName: "",
    supplementBrand: "",
    category: "",
    price: "",
    quantity: "",
    weight: "",
    expiryDate: "",
    description: "",
  });

  const [photoFile, setPhotoFile] = React.useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = React.useState("");
  const [errors, setErrors] = React.useState({});

  const validate = () => {
    const newErrors = {};

    if (!input.supplementName.trim()) newErrors.supplementName = "Supplement name is required.";
    if (!input.supplementBrand.trim()) newErrors.supplementBrand = "Brand is required.";
    if (!input.category) newErrors.category = "Please select a category.";

    const priceNum = Number(input.price);
    if (!String(input.price).trim()) newErrors.price = "Price is required.";
    else if (Number.isNaN(priceNum) || priceNum <= 0) newErrors.price = "Enter a valid price.";

    const qtyNum = Number(input.quantity);
    if (!String(input.quantity).trim()) newErrors.quantity = "Quantity is required.";
    else if (Number.isNaN(qtyNum) || qtyNum < 0) newErrors.quantity = "Enter a valid quantity.";

    if (!input.weight.trim()) newErrors.weight = "Weight is required.";
    if (!input.expiryDate) newErrors.expiryDate = "Expiry date is required.";

    if (photoFile) {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(photoFile.type)) newErrors.photo = "Only JPG, PNG, or WEBP images are allowed.";
      else if (photoFile.size > 5 * 1024 * 1024) newErrors.photo = "Photo must be 5MB or smaller.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlechange = (e) => {
    let value = e.target.value;

    if (e.target.name === "price" || e.target.name === "quantity") {
      value = value.replace(/[^\d.]/g, "");
    }

    setInput((prevState) => ({ ...prevState, [e.target.name]: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [e.target.name]: "" }));
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

  const sendRequest = async () => {
    const formData = new FormData();
    formData.append("supplementName", String(input.supplementName));
    formData.append("supplementBrand", String(input.supplementBrand));
    formData.append("category", String(input.category));
    formData.append("price", String(input.price));
    formData.append("quantity", String(input.quantity));
    formData.append("weight", String(input.weight));
    formData.append("expiryDate", String(input.expiryDate));
    formData.append("description", String(input.description || ""));

    if (photoFile) formData.append("photo", photoFile);

    await axios.post("http://localhost:5000/supplements", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await sendRequest();
      toast.success("Supplement submitted successfully! It is currently pending Admin approval.");
      navigate("/mainhome");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to submit supplement. Please try again.");
    }
  };

  return (
    <div>
      <Nav />
      <div className="add-suppliers-container">
        <h1>Add Supplement</h1>
        <form onSubmit={handleSubmit}>
          <label>Supplement Name:</label>
          <input
            type="text"
            name="supplementName"
            onChange={handlechange}
            value={input.supplementName}
            placeholder="Enter supplement name"
          />
          {errors.supplementName && <p className="error-msg">{errors.supplementName}</p>}

          <label>Supplement Brand:</label>
          <input
            type="text"
            name="supplementBrand"
            onChange={handlechange}
            value={input.supplementBrand}
            placeholder="Enter brand"
          />
          {errors.supplementBrand && <p className="error-msg">{errors.supplementBrand}</p>}

          <label>Category:</label>
          <select name="category" value={input.category} onChange={handlechange} className="select-input">
            <option value="">-- Select Category --</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && <p className="error-msg">{errors.category}</p>}

          <label>Price:</label>
          <input
            type="text"
            name="price"
            onChange={handlechange}
            value={input.price}
            placeholder="e.g. 4500"
          />
          {errors.price && <p className="error-msg">{errors.price}</p>}

          <label>Quantity:</label>
          <input
            type="text"
            name="quantity"
            onChange={handlechange}
            value={input.quantity}
            placeholder="e.g. 10"
          />
          {errors.quantity && <p className="error-msg">{errors.quantity}</p>}

          <label>Weight:</label>
          <input
            type="text"
            name="weight"
            onChange={handlechange}
            value={input.weight}
            placeholder="e.g. 2kg / 500g"
          />
          {errors.weight && <p className="error-msg">{errors.weight}</p>}

          <label>Expiry Date:</label>
          <input
            type="date"
            name="expiryDate"
            onChange={handlechange}
            value={input.expiryDate}
          />
          {errors.expiryDate && <p className="error-msg">{errors.expiryDate}</p>}

          <label>Description:</label>
          <textarea
            name="description"
            onChange={handlechange}
            value={input.description}
            placeholder="Write a short description..."
            rows={4}
            style={{ resize: "vertical" }}
          />

          <label>Photo (optional):</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
          {errors.photo && <p className="error-msg">{errors.photo}</p>}

          {photoPreviewUrl && (
            <div className="photo-preview-wrapper">
              <img src={photoPreviewUrl} alt="Selected supplement" className="photo-preview-image" />
            </div>
          )}

          <button type="submit">Add Supplement</button>
        </form>
      </div>
    </div>
  );
}

export default AddSupplements;

