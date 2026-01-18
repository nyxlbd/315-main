export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatDateShort = (date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'success',
    inactive: 'danger',
    suspended: 'warning',
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    processing: 'info',
    shipped: 'info',
    delivered: 'success',
    cancelled: 'danger',
  };
  return colors[status?.toLowerCase()] || 'primary';
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};
