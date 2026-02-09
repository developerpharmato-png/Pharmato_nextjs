// Format date to dd/MM/yy hH:MM am/pm
export function formatMargDate(dateString: string): string {
  if (!dateString) return "-";
  let date = new Date(dateString);
  if (isNaN(date.getTime())) {
    // Try to parse format like 'Jan 16, 2026 16:39 IST'
    // Remove timezone and parse manually
    const match = dateString.match(/([A-Za-z]{3}) (\d{1,2}), (\d{4}) (\d{2}):(\d{2})/);
    if (match) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIdx = months.indexOf(match[1]);
      if (monthIdx !== -1) {
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        const hour = parseInt(match[4], 10);
        const minute = parseInt(match[5], 10);
        date = new Date(year, monthIdx, day, hour, minute);
      }
    }
    if (isNaN(date.getTime())) return dateString;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
}


export const downloadImageByUrl = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response was not ok');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    const parts = url.split('/');
    a.download = (parts[parts.length - 1] || `image`).split('?')[0];
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error('Download failed, opening in new tab', err);
    window.open(url, '_blank');
  }
};


export const downloadInvoicePDF = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response was not ok');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;

    // Extract filename from URL or use default
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1] || 'invoice';
    const filename = lastPart.split('?')[0];

    // Ensure PDF extension
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error('Invoice download failed:', err);
  }
};



export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
    case "placed":
      return "status-pending";
    case "completed":
    case "success":
    case "delivered":
    case "approved":
      return "status-success";
    case "failed":
    case "cancelled":
    case "rejected":
      return "status-danger";
    case "processing":
    case "confirmed":
    case "packed":
      return "status-info";
    case "dispatched":
      return "status-purple";
    case "prescription re-upload required":
    case "re-upload required":
      return "status-warning";
    default:
      return "status-default";
  }
};
