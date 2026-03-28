import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import Nav from "../Nav/Nav";
import "./UpdateSupplements.css";

// API Endpoint for supplements
const SUPPLEMENTS_URL = "http://localhost:5000/supplements";

/**
 * Available categories and their associated products.
 * Used for dynamic dropdown selection in the form.
 */
const SUPPLIMENT_PRODUCTS = {
  "Vitamins": ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D", "Vitamin E", "Vitamin K"],
  "Proteins": ["Whey Protein", "Casein Protein", "Soy Protein", "Pea Protein"],
  "Minerals": ["Calcium", "Magnesium", "Zinc", "Iron", "Potassium"],
  "Herbs": ["Ashwagandha", "Turmeric", "Ginger", "Ginseng"],
  "Other": ["Fish Oil", "Probiotics", "Collagen", "Melatonin", "Creatine"]
};

/**
 * Helper function to format date for input[type="date"]
 * Converts ISO string or Date object to YYYY-MM-DD
 */
function toDateInputValue(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * UpdateSupplements Component
 * Handles the editing and updating of existing supplement products.
 */
function UpdateSupplements() {
  const { id } = useParams(); // Extract supplement ID from URL
  const navigate = useNavigate();

  // Component state management
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState({
    supplementName: "",
    supplementBrand: "",
    category: "",
    supplementProduct: "",
    price: "",
    quantity: "",
    weightValue: "",
    weightUnit: "mg",
    expiryDate: "",
    description: "",
  });

  // Photo state (file for upload, preview for UI, current for existing image)
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState("");
  const [errors, setErrors] = useState({});

  // Today's date in YYYY-MM-DD format (used to restrict the date picker)
  const todayStr = new Date().toISOString().split("T")[0];

  /**
   * Data Fetching Effect
   * Loads existing supplement data on component mount.
   */
  useEffect(() => {
    let alive = true; // Prevent state updates on unmounted component
    async function load() {
      try {
        setLoading(true);
        const res = await axios.get(`${SUPPLEMENTS_URL}/${id}`);
        const s = res.data?.supplement;
        if (!alive) return;

        // Parse weight string (e.g., "500mg") into numeric value and unit
        let weightValue = "";
        let weightUnit = "mg";
        if (s?.weight) {
          const match = s.weight.match(/^(\d+(?:\.\d+)?)(mg|g|kg)$/i);
          if (match) {
            weightValue = match[1];
            weightUnit = match[2].toLowerCase();
          } else {
            weightValue = s.weight; // Fallback if format is unexpected
          }
        }

        // Set form state with fetched data
        setInput({
          supplementName: s?.supplementName ?? "",
          supplementBrand: s?.supplementBrand ?? "",
          category: s?.category ?? "",
          supplementProduct: s?.supplementProduct ?? "",
          price: s?.price ?? "",
          quantity: s?.quantity ?? "",
          weightValue: weightValue,
          weightUnit: weightUnit,
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

  // Cleanup effect to revoke object URLs and prevent memory leaks
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) window.URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  /**
   * Form validation logic
   * Ensures data integrity before submission.
   */
  const validate = () => {
    const newErrors = {};
    if (!input.supplementName.trim()) newErrors.supplementName = "Supplement name is required.";
    if (!input.supplementBrand.trim()) newErrors.supplementBrand = "Brand is required.";
    if (!input.category) newErrors.category = "Please select a category.";
    if (!input.supplementProduct) newErrors.supplementProduct = "Please select a product.";

    // Numeric validation for price and quantity
    const priceNum = Number(input.price);
    if (!String(input.price).trim()) newErrors.price = "Price is required.";
    else if (Number.isNaN(priceNum) || priceNum <= 0) newErrors.price = "Enter a valid price.";

    const qtyNum = Number(input.quantity);
    if (!String(input.quantity).trim()) newErrors.quantity = "Quantity is required.";
    else if (Number.isNaN(qtyNum) || qtyNum < 0) newErrors.quantity = "Enter a valid quantity.";

    // Split weight validation
    if (!String(input.weightValue).trim()) {
      newErrors.weight = "Weight value is required.";
    } else if (Number(input.weightValue) <= 0) {
      newErrors.weight = "Weight must be greater than 0.";
    }

    // Expiry date validation (must be today or in the future)
    if (!input.expiryDate) {
      newErrors.expiryDate = "Expiry date is required.";
    } else {
      const selectedDate = new Date(input.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare only dates
      if (selectedDate < today) {
        newErrors.expiryDate = "Expiry date cannot be in the past.";
      }
    }

    // Photo validation
    if (photoFile) {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(photoFile.type)) newErrors.photo = "Only JPG, PNG, or WEBP images are allowed.";
      else if (photoFile.size > 5 * 1024 * 1024) newErrors.photo = "Photo must be 5MB or smaller.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Universal input change handler
   */
  const handleChange = (e) => {
    let { name, value } = e.target;

    // Remove non-numeric characters for specific fields
    if (name === "price" || name === "quantity" || name === "weightValue") {
      value = value.replace(/[^\d.]/g, "");
    }

    // Reset product selection when category changes
    if (name === "category") {
      setInput((prev) => ({
        ...prev,
        category: value,
        supplementProduct: "",
      }));
      setErrors((prev) => ({
        ...prev,
        category: "",
        supplementProduct: "",
      }));
      return;
    }

    setInput((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /**
   * Photo file selection handler
   */
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

  /**
   * Form submission handler
   * Uses FormData to handle file upload alongside text fields.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const formData = new FormData();
      formData.append("supplementName", String(input.supplementName));
      formData.append("supplementBrand", String(input.supplementBrand));
      formData.append("category", String(input.category));
      formData.append("supplementProduct", String(input.supplementProduct));
      formData.append("price", String(input.price));
      formData.append("quantity", String(input.quantity));
      // Combine split weight into a single string (e.g., "500mg")
      formData.append("weight", `${input.weightValue}${input.weightUnit}`);
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
      <div className="update-supplements-container">
        <h1>Update Supplement</h1>

        {loading ? (
          <div className="empty-msg">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* --- Basic Information Section --- */}
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

            {/* --- Category & Product Selection Section --- */}
            <label>Category:</label>
            <select name="category" value={input.category} onChange={handleChange} className="select-input">
              <option value="">-- Select Category --</option>
              {Object.keys(SUPPLIMENT_PRODUCTS).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="error-msg">{errors.category}</p>}

            {input.category && (
              <>
                <label>Supplement Product:</label>
                <select name="supplementProduct" value={input.supplementProduct} onChange={handleChange} className="select-input">
                  <option value="">-- Select Product --</option>
                  {SUPPLIMENT_PRODUCTS[input.category].map((product) => (
                    <option key={product} value={product}>{product}</option>
                  ))}
                </select>
                {errors.supplementProduct && <p className="error-msg">{errors.supplementProduct}</p>}
              </>
            )}

            {/* --- Pricing & Inventory Section --- */}
            <label>Price:</label>
            <input type="text" name="price" onChange={handleChange} value={input.price} placeholder="e.g. 4500" />
            {errors.price && <p className="error-msg">{errors.price}</p>}

            <label>Quantity:</label>
            <input type="text" name="quantity" onChange={handleChange} value={input.quantity} placeholder="e.g. 10" />
            {errors.quantity && <p className="error-msg">{errors.quantity}</p>}

            {/* --- Specifications Section (Weight & Expiry) --- */}
            <label>Weight:</label>
            <div className="weight-input-group">
              <input
                type="text"
                name="weightValue"
                onChange={handleChange}
                value={input.weightValue}
                placeholder="e.g. 500"
                className="weight-value-input"
              />
              <select
                name="weightUnit"
                value={input.weightUnit}
                onChange={handleChange}
                className="select-input weight-unit-select"
              >
                <option value="mg">mg</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </div>
            {errors.weight && <p className="error-msg">{errors.weight}</p>}

            <label>Expiry Date:</label>
            <input
              type="date"
              name="expiryDate"
              onChange={handleChange}
              value={input.expiryDate}
              min={todayStr} /* Prevents selecting past dates */
            />
            {errors.expiryDate && <p className="error-msg">{errors.expiryDate}</p>}

            {/* --- Additional Details Section --- */}
            <label>Description:</label>
            <textarea
              name="description"
              onChange={handleChange}
              value={input.description}
              placeholder="Write a short description..."
              rows={4}
              className="description-textarea"
            />

            <label>Photo (optional):</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            {errors.photo && <p className="error-msg">{errors.photo}</p>}

            {/* --- Visual Feedback Section (Existing Photo & New Preview) --- */}
            <div className="photo-comparison-row">
              <div className="photo-comparison-column">
                <div className="photo-comparison-label">Current photo</div>
                <div className="photo-comparison-avatar">
                  {currentPhotoUrl ? <img src={currentPhotoUrl} alt="Current supplement" /> : <span>—</span>}
                </div>
              </div>
              <div className="photo-comparison-column">
                <div className="photo-comparison-label">New photo preview</div>
                <div className="photo-comparison-avatar">
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
