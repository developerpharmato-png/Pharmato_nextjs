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