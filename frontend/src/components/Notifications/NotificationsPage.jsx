import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Trash2, Bell, AlertTriangle, Info, CheckCircle } from "lucide-react";
import Nav from "../Nav/Nav";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const supplierId = localStorage.getItem("supplierId");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [restocking, setRestocking] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!supplierId) {
      toast.error("Please login as a supplier to view notifications.");
      navigate("/supplier-login");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/notifications/supplier/${supplierId}`);
      const fetchedNotifications = res.data?.notifications ?? [];
      setNotifications(fetchedNotifications);

      if (fetchedNotifications.some(n => !n.isRead)) {
        await axios.patch(`http://localhost:5000/notifications/supplier/${supplierId}/read-all`);
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read', isRead: true })));
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [supplierId, navigate]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleDelete = useCallback(async (e, ids) => {
    e.stopPropagation();
    const idList = Array.isArray(ids) ? ids : [ids];
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => !idList.includes(n._id)));
    
    try {
      await Promise.all(idList.map(id => axios.delete(`http://localhost:5000/notifications/${id}`)));
      toast.success("Notification dismissed.");
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
      setNotifications(originalNotifications);
      toast.error("Failed to dismiss notification.");
    }
  }, [notifications]);

  const handleShipmentUpdate = useCallback(async (notificationId, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/notifications/${notificationId}/shipment`, {
        shipmentStatus: newStatus
      });
      toast.success(`Order marked as ${newStatus}`);
      fetchNotifications();
    } catch (err) {
      toast.error("Failed to update shipment status");
      console.error(err);
    }
  }, [fetchNotifications]);

  const handleRestockSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedNotification || !selectedNotification.relatedSupplementId) return;

    try {
      setRestocking(true);
      const supplementId = selectedNotification.relatedSupplementId._id;
      
      // Update stock quantity
      await axios.put(`http://localhost:5000/supplements/reorder/${supplementId}`, {
        newQuantity: restockQuantity
      });

      // Auto-dismiss the notification(s) for this product
      const notificationIds = selectedNotification.isGrouped ? selectedNotification.ids : [selectedNotification._id];
      await Promise.all(notificationIds.map(id => axios.delete(`http://localhost:5000/notifications/${id}`)));

      toast.success("Inventory restocked and notification cleared!");
      setIsRestockModalOpen(false);
      setSelectedNotification(null);
      setRestockQuantity(1);
      
      // Refresh notifications list
      fetchNotifications();
    } catch (err) {
      console.error("Restock failed:", err);
      toast.error(err.response?.data?.message || "Failed to restock inventory.");
    } finally {
      setRestocking(false);
    }
  }, [selectedNotification, restockQuantity, fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab === "orders") {
        return n.type === "order_notification";
      }
      return n.type === "restock_request";
    });
  }, [notifications, activeTab]);

  const grouped = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = { Today: [], Yesterday: [], Older: [] };

    if (activeTab === 'inventory') {
      const productGroups = {};
      filteredNotifications.forEach(n => {
        const productId = n.relatedSupplementId?._id || 'unknown';
        if (!productGroups[productId]) {
          productGroups[productId] = { ...n, isGrouped: true, ids: [n._id], latestDate: new Date(n.createdAt) };
        } else {
          productGroups[productId].ids.push(n._id);
          const currentDate = new Date(n.createdAt);
          if (currentDate > productGroups[productId].latestDate) {
            productGroups[productId].latestDate = currentDate;
          }
        }
      });

      Object.values(productGroups).forEach(groupedNode => {
        const date = new Date(groupedNode.latestDate);
        date.setHours(0, 0, 0, 0);
        if (date.getTime() === today.getTime()) groups.Today.push(groupedNode);
        else if (date.getTime() === yesterday.getTime()) groups.Yesterday.push(groupedNode);
        else groups.Older.push(groupedNode);
      });
    } else {
      filteredNotifications.forEach(n => {
        const date = new Date(n.createdAt);
        date.setHours(0, 0, 0, 0);
        if (date.getTime() === today.getTime()) groups.Today.push(n);
        else if (date.getTime() === yesterday.getTime()) groups.Yesterday.push(n);
        else groups.Older.push(n);
      });
    }
    return groups;
  }, [filteredNotifications, activeTab]);

  const unreadOrderCount = useMemo(() => 
    notifications.filter(n => n.type === "order_notification" && !n.isRead).length
  , [notifications]);

  const unreadInventoryCount = useMemo(() => 
    notifications.filter(n => n.type === "restock_request" && !n.isRead).length
  , [notifications]);

  const renderNotificationCard = (n) => {
    const isInventory = n.type === 'restock_request';
    return (
      <div key={n._id} className={`notification-card ${n.status} type-${n.type}`}>
        <div className="notification-card-header">
          <div className="header-left">
            <span className={`badge type-badge ${n.type}`}>
              {n.type === 'order_notification' ? (
                <span className="flex items-center gap-2">
                  <CheckCircle size={14} /> New Order Received
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <AlertTriangle size={14} /> Restock Request
                </span>
              )}
            </span>
          </div>
          <div className="header-right">
            {/* Notification ID or other info can go here */}
          </div>
        </div>
        
        <div className={`notification-card-content ${isInventory ? 'inventory-layout' : ''}`}>
          <div className="main-info">
            {isInventory ? (
              <div className="inventory-alert-minimal">
                <div className="product-info-minimal">
                  <h3 className="product-title-bold">{n.relatedSupplementId?.supplementName || 'Unknown Product'}</h3>
                  <span className="product-brand-minimal">{n.relatedSupplementId?.supplementBrand || 'N/A'}</span>
                </div>
                <div className="stock-level-minimal">
                  <span className="stock-label">Current Stock:</span>
                  <span className="stock-value">{n.relatedSupplementId?.availableStock ?? 0}</span>
                </div>
                <div className="inventory-actions">
                  <button 
                    className="btn-gms btn-gms-primary"
                    onClick={() => {
                      setSelectedNotification(n);
                      setIsRestockModalOpen(true);
                    }}
                  >
                    Restock Now
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="title-row">
                  <span className="icon-check">
                    <CheckCircle size={18} color="#16a34a" />
                  </span>
                  <h3>{n.message}</h3>
                </div>
                <div className="product-details">
                  <p><strong>Product:</strong> {n.relatedSupplementId?.supplementName || 'N/A'}</p>
                  <p><strong>Quantity Ordered:</strong> {n.quantity}</p>
                </div>
              </>
            )}
          </div>

          {!isInventory && n.type === 'order_notification' && (
            <div className="buyer-info">
              <div className="info-block">
                <label>Buyer Details</label>
                <p className="buyer-name">{n.buyerName}</p>
                <p className="buyer-address">{n.buyerAddress}</p>
              </div>
            </div>
          )}

          <div className="status-section">
            {!isInventory && n.type === 'order_notification' && (
              <div className="status-badge-container">
                <label>Shipment Status</label>
                <span className={`shipment-status-badge ${n.shipmentStatus?.replace(' ', '-').toLowerCase()}`}>
                  {n.shipmentStatus || 'Pending Dispatch'}
                </span>
              </div>
            )}
            <div className="action-buttons">
              {!isInventory && n.type === 'order_notification' && n.shipmentStatus !== 'Shipped' && (
                <button className="btn-mark-shipped" onClick={() => handleShipmentUpdate(n._id, 'Shipped')}>
                  Mark as Shipped
                </button>
              )}
              <button 
                className="btn-gms btn-gms-danger" 
                onClick={(e) => handleDelete(e, n.isGrouped ? n.ids : n._id)}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="notifications-page">
      <Nav />
      <div className="notifications-container section-spacing">
        <header className="notifications-header">
          <h1 className="page-title">Notifications Center</h1>
        </header>

        <div className="notifications-tabs">
          <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            Orders Received
            {unreadOrderCount > 0 && <span className="tab-badge flex items-center gap-1"><Info size={12} /> {unreadOrderCount}</span>}
          </button>
          <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            Inventory Alerts
            {unreadInventoryCount > 0 && <span className="tab-badge flex items-center gap-1"><AlertTriangle size={12} /> {unreadInventoryCount}</span>}
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state-centered">
            <div className="empty-icon-large">
              <Bell size={64} strokeWidth={1} color="#64748b" />
            </div>
            <h2>You're all caught up!</h2>
            <p>No new {activeTab === 'orders' ? 'orders' : 'inventory alerts'} at the moment.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {Object.entries(grouped).map(([dateLabel, list]) => (
              list.length > 0 && (
                <div key={dateLabel} className="date-group">
                  <h2 className="group-title">{dateLabel}</h2>
                  {list.map(n => renderNotificationCard(n))}
                </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {isRestockModalOpen && selectedNotification && (
        <div className="modal-overlay" onClick={() => setIsRestockModalOpen(false)}>
          <div className="restock-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Restock Inventory</h2>
              <button className="close-btn" onClick={() => setIsRestockModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleRestockSubmit}>
              <div className="modal-body">
                <div className="product-brief">
                  <p><strong>Product:</strong> {selectedNotification.relatedSupplementId?.supplementName}</p>
                  <p><strong>Current Stock:</strong> {selectedNotification.relatedSupplementId?.availableStock ?? 0}</p>
                </div>
                <div className="form-group">
                  <label>Add Stock Quantity</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={restockQuantity} 
                    onChange={(e) => setRestockQuantity(Number(e.target.value))}
                    required 
                    autoFocus
                  />
                  <p className="help-text">Enter the number of units you are adding to the current stock.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRestockModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={restocking}>
                  {restocking ? "Updating..." : "Confirm Restock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
