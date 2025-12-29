export  const downloadImageByUrl = async (url: string) => {
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


   
 export   const getStatusColor = (status: string) => {
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
  