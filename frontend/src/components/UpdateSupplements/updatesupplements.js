import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import Nav from "../Nav/Nav";
import "../AddSuppliers/addsuppliers.css";

const SUPPLEMENTS_URL = "http://localhost:5000/supplements";
const CATEGORIES = ["Proteins", "Vitamins", "Creatine", "Minerals", "Herbs", "Other"];

function toDateInputValue(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function UpdateSupplements() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState({
    supplementName: "",
    supplementBrand: "",
    category: "",
    price: "",
    quantity: "",
    weight: "",
    expiryDate: "",
    description: "",
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const res = await axios.get(`${SUPPLEMENTS_URL}/${id}`);
        const s = res.data?.supplement;
        if (!alive) return;

        setInput({
          supplementName: s?.supplementName ?? "",
          supplementBrand: s?.supplementBrand ?? "",
          category: s?.category ?? "",
          price: s?.price ?? "",
          quantity: s?.quantity ?? "",
          weight: s?.weight ?? "",
          expiryDate: toDateInputValue(s?.expiryDate),
          description: s?.description ?? "",
        });
        setCurrentPhotoUrl(s?.photoUrl ?? "");
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load supplement.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) window.URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

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

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === "price" || e.target.name === "quantity") {
      value = value.replace(/[^\d.]/g, "");
    }
    setInput((prev) => ({ ...prev, [e.target.name]: value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setPhotoFile(null);
      setPhotoPreviewUrl("");
      return;
    }
    setPhotoFile(file);
    setPhotoPreviewUrl(window.URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, photo: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
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

      await axios.put(`${SUPPLEMENTS_URL}/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Supplement updated successfully!");
      navigate("/supplementsdetails");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update supplement.");
    }
  };

  return (
    <div>
      <Nav />
      <div className="add-suppliers-container">
        <h1>Update Supplement</h1>
        {loading ? (
          <div className="empty-msg">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Supplement Name:</label>
            <input
              type="text"
              name="supplementName"
              onChange={handleChange}
              value={input.supplementName}
              placeholder="Enter supplement name"
            />
            {errors.supplementName && <p className="error-msg">{errors.supplementName}</p>}

            <label>Supplement Brand:</label>
            <input
              type="text"
              name="supplementBrand"
              onChange={handleChange}
              value={input.supplementBrand}
              placeholder="Enter brand"
            />
            {errors.supplementBrand && <p className="error-msg">{errors.supplementBrand}</p>}

            <label>Category:</label>
            <select name="category" value={input.category} onChange={handleChange} className="select-input">
              <option value="">-- Select Category --</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="error-msg">{errors.category}</p>}

            <label>Price:</label>
            <input type="text" name="price" onChange={handleChange} value={input.price} placeholder="e.g. 4500" />
            {errors.price && <p className="error-msg">{errors.price}</p>}

            <label>Quantity:</label>
            <input type="text" name="quantity" onChange={handleChange} value={input.quantity} placeholder="e.g. 10" />
            {errors.quantity && <p className="error-msg">{errors.quantity}</p>}

            <label>Weight:</label>
            <input type="text" name="weight" onChange={handleChange} value={input.weight} placeholder="e.g. 2kg / 500g" />
            {errors.weight && <p className="error-msg">{errors.weight}</p>}

            <label>Expiry Date:</label>
            <input type="date" name="expiryDate" onChange={handleChange} value={input.expiryDate} />
            {errors.expiryDate && <p className="error-msg">{errors.expiryDate}</p>}

            <label>Description:</label>
            <textarea
              name="description"
              onChange={handleChange}
              value={input.description}
              placeholder="Write a short description..."
              rows={4}
              style={{ resize: "vertical" }}
            />

            <label>Photo (optional):</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            {errors.photo && <p className="error-msg">{errors.photo}</p>}

            <div className="update-suppliers-photoRow">
              <div className="update-suppliers-photoCol">
                <div className="update-suppliers-photoLabel">Current photo</div>
                <div className="update-suppliers-avatar">
                  {currentPhotoUrl ? <img src={currentPhotoUrl} alt="Current supplement" /> : <span>—</span>}
                </div>
              </div>
              <div className="update-suppliers-photoCol">
                <div className="update-suppliers-photoLabel">New photo preview</div>
                <div className="update-suppliers-avatar">
                  {photoPreviewUrl ? <img src={photoPreviewUrl} alt="New supplement preview" /> : <span>—</span>}
                </div>
              </div>
            </div>

            <button type="submit">Update Supplement</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default UpdateSupplements;

