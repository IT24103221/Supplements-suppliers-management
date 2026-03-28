import React from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import Nav from "../Nav/Nav";
import "./AddSupplements.css";

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
 * AddSupplements Component
 * Handles the submission of new supplement products to the system.
 */
function AddSupplements() {
  const navigate = useNavigate();
  const location = useLocation();

  // Route Guard Logic
  React.useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const supplierStatus = localStorage.getItem("supplierStatus");

    // Must be a supplier and status must be Approved
    if (userRole !== "supplier" || supplierStatus !== "Approved") {
      toast.error("Unauthorized Access: Only Approved Suppliers can add supplements.");
      navigate("/mainhome");
    }
  }, [navigate]);

  // Extract supplierId from URL query parameters OR LocalStorage
  const queryParams = new URLSearchParams(location.search);
  const supplierIdFromUrl = queryParams.get("supplierId");
  const supplierIdFromSession = localStorage.getItem("supplierId");
  const finalSupplierId = supplierIdFromUrl || supplierIdFromSession || "";

  // Initial state for form fields
  const [input, setInput] = React.useState({
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

  // State for photo handling and validation errors
  const [photoFile, setPhotoFile] = React.useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = React.useState("");
  const [errors, setErrors] = React.useState({});

  // Today's date in YYYY-MM-DD format (used to restrict the date picker)
  const todayStr = new Date().toISOString().split("T")[0];

  /**
   * Form validation logic
   * Checks for required fields and proper data formats.
   */
  const validate = () => {
    const newErrors = {};

    // Basic required field validations
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

    // Split weight validation (checks only the numeric value part)
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

    // Photo validation (type and size constraints)
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
   * Handles text inputs, selects, and specific numeric cleaning.
   */
  const handlechange = (e) => {
    let { name, value } = e.target;

    // Remove non-numeric characters for specific fields
    if (name === "price" || name === "quantity" || name === "weightValue") {
      value = value.replace(/[^\d.]/g, "");
    }

    // Reset product selection when category changes
    if (name === "category") {
      setInput((prevState) => ({
        ...prevState,
        category: value,
        supplementProduct: "",
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        category: "",
        supplementProduct: "",
      }));
      return;
    }

    setInput((prevState) => ({ ...prevState, [name]: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  /**
   * Photo file selection handler
   * Generates a preview URL for the selected image.
   */
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

  // Cleanup effect to revoke object URLs and prevent memory leaks
  React.useEffect(() => {
    return () => {
      if (photoPreviewUrl) window.URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  /**
   * API request function
   * Packs form data into FormData for multipart upload.
   */
  const sendRequest = async () => {
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
    
    // Automatically include the Supplier ID if it exists
    if (finalSupplierId) {
      formData.append("supplierId", finalSupplierId);
    }

    if (photoFile) formData.append("photo", photoFile);

    await axios.post("http://localhost:5000/supplements", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  /**
   * Form submission handler
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await sendRequest();
      toast.success("Supplement submitted successfully! It is currently pending Admin approval.");
      
      // If we have a supplierId, redirect back to the Supplier Dashboard
      if (finalSupplierId) {
        navigate(`/supplier-dashboard/${finalSupplierId}`);
      } else {
        navigate("/mainhome");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to submit supplement. Please try again.");
    }
  };

  return (
    <div>
      <Nav />
      <div className="add-supplements-container">
        <h1>Add Supplement</h1>
        
        <form onSubmit={handleSubmit}>
          {/* --- Basic Information Section --- */}
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

          {/* --- Category & Product Selection Section --- */}
          <label>Category:</label>
          <select name="category" value={input.category} onChange={handlechange} className="select-input">
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
              <select name="supplementProduct" value={input.supplementProduct} onChange={handlechange} className="select-input">
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

          {/* --- Specifications Section (Weight & Expiry) --- */}
          <label>Weight:</label>
          <div className="weight-input-group">
            <input
              type="text"
              name="weightValue"
              onChange={handlechange}
              value={input.weightValue}
              placeholder="e.g. 500"
              className="weight-value-input"
            />
            <select
              name="weightUnit"
              value={input.weightUnit}
              onChange={handlechange}
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
            onChange={handlechange}
            value={input.expiryDate}
            min={todayStr} /* Prevents selecting past dates */
          />
          {errors.expiryDate && <p className="error-msg">{errors.expiryDate}</p>}

          {/* --- Additional Details Section --- */}
          <label>Description:</label>
          <textarea
            name="description"
            onChange={handlechange}
            value={input.description}
            placeholder="Write a short description..."
            rows={4}
            className="description-textarea"
          />

          <label>Photo (optional):</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
          {errors.photo && <p className="error-msg">{errors.photo}</p>}

          {/* --- Visual Feedback Section (Photo Preview) --- */}
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
